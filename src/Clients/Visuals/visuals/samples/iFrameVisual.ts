/*
*  IFrame Sample visual 
*
*  Copyright (c) Lukasz Pawlowski @lukasztweets
*
*
*  All rights reserved. 
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*   
*  The above copyright notice and this permission notice shall be included in 
*  all copies or substantial portions of the Software.
*   
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.*
*/

module powerbi.visuals {
	export class IFrameVisual implements IVisual {
	
	// how to validate these are correct?
        public static instances: Array<IFrameVisual> = new Array<IFrameVisual>();
		public static capabilities: VisualCapabilities = {
            dataRoles: [
                {
                    name: 'Category',
                    kind: 0,
                    displayName: 'Item',
                }, {
                    name: 'Y',
                    kind: 1,
                    displayName: 'Value',
                }
            ],
            dataViewMappings: [{
                conditions: [
                    { 'Category': { max: 1 } },
                    { 'Category': { max: 1 }, 'Y': { max: 1 }},
                ],
                categorical: {
                    categories: {
                        for: { in: 'Category' },
                        dataReductionAlgorithm: { window: {} }
                    },
                    values: {
                        group: {
                            by: 'Category',
                            select: [{ for: { in: 'Y' } }],
                            dataReductionAlgorithm: { window: {} }
                        }
                    },
                    rowCount: { preferred: { min: 2 }, supported: { min: 0 } }  // what does this do?
                },
            }],
            //supportsHighlight: true,
            sorting: {
                none: {},
            },
			suppressDefaultTitle: true,
		};
        
		/*
					if (this.interactivityService) {
                        this.interactivityService.applySelectionStateToData(this.data.slices);
                    }
					
					public applySelectionStateToData(dataPoints: SelectableDataPoint[]): boolean {
            for (var i = 0, len = dataPoints.length; i < len; i++) {
                var dataPoint = dataPoints[i];
                dataPoint.selected = this.selectedIds.some((selectedId) => selectedId.includes(dataPoint.identity));
            }
            return this.hasSelection();
        }
		*/
		
        private element: JQuery;
        private viewport: IViewport;
		private self: D3.Selection;
        private iFrame: D3.Selection;
        private container: D3.Selection;
        private warningBox: D3.Selection;
        private warningBoxURLLabel: D3.Selection;
        private warningBoxAllowAlwaysButton: D3.Selection;
        public GUID: string; 
        private iframeGUID: string;
        private containerGUID: string;
        private warningBoxGUID: string;
		private iframeString: string;
		private iframeUrl: string;
		private data: IFrameVisualDataNode[];
		private selected: IFrameVisualDataNode[];
		private hasSelection: boolean;
		private interactivityService: IInteractivityService;
        private hostServices: IVisualHostServices;
        public isAllowedByUser: boolean;

        constructor() {
            this.GUID = (Math.random() * 100000000000000000000).toString(); 
            this.iframeGUID = "iframe_" + this.GUID;
            this.containerGUID = "container_" + this.GUID;
			this.iframeUrl = "https://www.youtube.com/embed/3WCJsCFQGOw";
			this.iframeString = "<iframe width=\"{0}\" height=\"{1}\" src=\"{2}\" frameborder=\"0\" allowfullscreen></iframe>";
            this.data = []; //empty array.
            IFrameVisual.instances.push(this);
		}

		public init(options: VisualInitOptions) {
            this.element = options.element;
            this.viewport = options.viewport;
			this.interactivityService = VisualInteractivityFactory.buildInteractivityService(options);
            this.hostServices = options.host;
            this.hasSelection = false;

            //TODO: get list of approved URL roots from localStorage.

			this.draw();
        }

        public static AllowUrlAlways(inUrl: string): void {
            var allowedURLs: Array<string> = IFrameVisual.GetAllowedUrls();
            allowedURLs.push(inUrl);
            IFrameVisual.SetAllowedUrls(allowedURLs);
        }
        public static GetAllowedUrls(): Array<string> {
            var allowedUrlsKey: string = "iframeVisualAllowedRootUrls";
            var allowedURLsString = localStorage.getItem(allowedUrlsKey);
            var allowedURLs = null;

            if (allowedURLsString) {
                allowedURLs = JSON.parse(allowedURLsString);
            }

            if (!allowedURLs) {
                allowedURLs = Array<string>();
            }
            return allowedURLs;
        }
        public static SetAllowedUrls(allowedUrls: Array<string>): void {
            var allowedUrlsKey: string = "iframeVisualAllowedRootUrls";
            localStorage.setItem(allowedUrlsKey, JSON.stringify(allowedUrls));
        }
        private IsRootUrlAllowed(inUrl: string): boolean {
            var allowedUrls: Array<string> = IFrameVisual.GetAllowedUrls();
            var isAllowed = false;
            for (var i = 0; i < allowedUrls.length; i++)
            {
                var curUrl = allowedUrls[i];
                if (curUrl === inUrl)
                {
                    isAllowed = true;
                    break;
                }
            }
            return isAllowed;
        }

        public destroy(){
            var curGUID = this.GUID;
            // find the iframeVisual that generated the user action
            var newArray = new Array<IFrameVisual>();
            
            for (var v = 0; v < IFrameVisual.instances.length; v++) {
                var curInstance = IFrameVisual.instances[v];
                if (curInstance.GUID !== curGUID) {
                    newArray.push(curInstance);
                }
            }

            IFrameVisual.instances = newArray;
        }

		public onResizing(finalViewport: IViewport): void {
			/** This api will be deprecated, please use only update */
			this.viewport = finalViewport;

			this.draw();
		}
		public onDataChanged(options: VisualDataChangedOptions): void {
			this.draw();
		}
		/** Notifies the IVisual to clear any selection. */
        public onClearSelection(): void{
			this.selected = [];
			this.draw();
		}

        /** Notifies the IVisual to select the specified object. */
        public onSelectObject(object: VisualObjectInstance): void{
			//todo does this do anything?
			this.draw();
		}
		
		public update(options: VisualUpdateOptions): void {
			this.viewport = options.viewport;
			this.updateData(options.dataViews);
			this.draw();
        }

        private getSafeUrl(inUrl: string): IFrameVisualUrl {
            var outUrl: string = encodeURI(inUrl);
            var rootUrl: string = "";
            var isWebUrl: boolean = false;
            var root1:string = "http://";
            var root2: string = "https://";

            var indexOfAt: number  = outUrl.indexOf("@");
            if (indexOfAt >= 0)
            {
                outUrl = outUrl.slice(indexOfAt+1);
            }
            
            var indexR1 = outUrl.indexOf(root1);
            var indexR2 = outUrl.indexOf(root2);

            if (indexR1 === 0 || indexR2 === 0)
            {
                var curRoot = indexR1 === 0 ? root1 : root2;
                var tempUrl = outUrl.slice(curRoot.length);

                var indexSlash = tempUrl.indexOf("/");
                var indexQuestion = tempUrl.indexOf("?");
                var values = [indexSlash, indexQuestion];
                values = values.map(function (x) 
                    {
                        if (x >= 0) {
                            return x;
                        }
                    }
                    );
                var indexEnd = d3.min(values);
                if (indexEnd >= 0) {
                    rootUrl = outUrl.slice(0, curRoot.length + indexEnd); 
                }
                isWebUrl = true;
            }

            var curUrl: IFrameVisualUrl =
                {
                    url: outUrl,
                    rootUrl: rootUrl,
                    isWebUrl: isWebUrl
                };

            return curUrl;
        }
		
		public draw()
        {
            if (!this.self) {
                this.self = d3.select(this.element.get(0));
            }

			var width = this.viewport.width;
			var height = this.viewport.height;

            // build the load url
            var tempUrl = this.data.length === 0 ? this.iframeUrl : this.data[0].url;
            var safeUrl = this.getSafeUrl(tempUrl);
            var urlToLoad = safeUrl.url;
             
            if (this.data.length === 0) { urlToLoad = this.getSafeUrl(this.iframeUrl).url; } //set a default (should be how to use this visual iframe)
            else { urlToLoad = this.getSafeUrl(this.data[0].url).url; }
            
            // provide a div to host the content.
            if (!this.container) {
                var curContainer = d3.select(this.element.get(0)).append("div");
                curContainer
                    .attr("id", this.containerGUID)
                    .attr("overflow", "auto")
                    ;

                this.container = curContainer;
            }

            // ensure if the url changed, the user is warned.
            // default to warn the user
            var isURLUpdated = true;
            if (this.iFrame) {
                var curURL = this.iFrame.attr("src");
                if (curURL && (curURL === safeUrl.url)) {
                    isURLUpdated = false;
                }
            }
            else
            {
                isURLUpdated = false;
            }
            // if url changed ask for consent
            if (isURLUpdated) {
                this.isAllowedByUser = false;
            }

            // check if the user allowed the iFrame URL to load			
            if (!this.isAllowedByUser && !this.IsRootUrlAllowed(safeUrl.rootUrl))
            {
                this.isAllowedByUser = false;

                //remove the iFrame if needed
                if (this.iFrame)
                {
                    this.iFrame.remove();
                    this.iFrame = null;
                }

                //show the warning box
                if (!this.warningBox) {
                    this.warningBox = this.container.append("div");
                    this.warningBox
                        .attr("id", this.warningBoxGUID)
                        .attr("z-index", 10000)
                        .attr("style", "display: initial;-webkit-user-select: initial;")
                    ;
                    if (safeUrl.isWebUrl) {
                        this.warningBox
                            .append("p")
                            .html("<b>Warning:</b> This visual will load content not hosted in Power BI. Some data will be sent to a 3rd party site. Please review the URL below before loading the content.")
                        ;
                        //ask user to consent
                        this.warningBox.append("button")
                            .attr("iframeVisualBinding", this.GUID)
                            .html("Allow content once")
                            .on("click", this.handleAllowClick)
                        ;
                        this.warningBox.append("br");
                        this.warningBox.append("br");
                        this.warningBoxAllowAlwaysButton = this.warningBox.append("button");
                        this.warningBoxAllowAlwaysButton
                            .attr("iframeVisualBinding", this.GUID)
                            .attr("iframeVisualRootUrl", safeUrl.rootUrl)
                            .html("Always allow content from '" + safeUrl.rootUrl + "'.")
                            .on("click", this.handleAllowAlwaysClick)
                        ;
                    }
                    else {
                        this.warningBox.append("p")
                            .html("<b>Content Blocked</b> because the URL does not start with 'http://' or 'https://'. Please use a valid web URL.")
                        ; 
                    }
                    this.warningBoxURLLabel = this.warningBox
                        .append("p")
                    ;
                }

                //ensure the warning box content is updated 
                this.warningBoxAllowAlwaysButton
                    .attr("iframeVisualBinding", this.GUID)
                    .attr("iframeVisualRootUrl", safeUrl.rootUrl)
                    .html("Always allow content from '" + safeUrl.rootUrl + "'.")
                ;

                this.warningBoxURLLabel
                    .html("The URL is:<br>" + safeUrl.url);

                this.container
                    .attr("style", "overflow: auto;" +
                        "height: " + height.toString() + "px;" +
                        "width: " + width.toString() + "px;") ;

            }
            else
            {
                //remove warning box
                if (this.warningBox) {
                    this.warningBox.remove();
                    this.warningBox = null;

                    this.container
                        .attr("style", "overflow: hidden;" +
                            "height: 100%;" +
                            "width: 100%;" );

                }

                //draw the iframe 
                if (!this.iFrame) {
                    // init
                    // iframeString = "<iframe width=\"{0}\" height=\"{1}\" src=\"{2}\" frameborder=\"0\" allowfullscreen></iframe>";

                    //var curIFrame = d3.select(this.element.get(0)).append("iframe");
                    var curIFrame = this.container.append("iframe");
                    curIFrame
                        .attr("id", this.iframeGUID)
                        .attr("src", safeUrl.url)
                        .attr("frameborder", 0)
                        .attr("allowfullscreen")
                        ;

                    this.iFrame = curIFrame;
                }

                //set dimensions
                this.iFrame
                    .attr("width", width)
                    .attr("height", height);

                //update if the url changed
                var curURL = this.iFrame.attr("src");
                if (curURL && (curURL !== safeUrl.url)) {
                    this.iFrame
                        .attr("src", safeUrl.url);
                }
            }

            /*
			if(this.data.length === 0 ) {
				this.iFrame
					.attr("src", this.iframeUrl);
			}
			else{
				// set URL 
                var inURL = this.data[0].url;

                // make iFrame overlayable opacity
                // ref1: http://stackoverflow.com/questions/3820325/overlay-opaque-div-over-youtube-iframe
                // ref2: https://helpx.adobe.com/x-productkb/multi/swf-file-ignores-stacking-order.html
                inURL = inURL + "?wmode=opaque";

				//inURL = inURL;	
				
				if(this.hasSelection)
				{
					//find the selected item
				}
				
				//update if the url changed
				var curURL = this.iFrame.attr("src");
				if(curURL && (curURL !== inURL))
				{
					this.iFrame
						.attr("src", inURL); 
				}
			}
            */
        }

        private handleAllowClick(d: any, i:any)
        {
            // now in the context of the button that was clicked
            var allowForGUID = d3.event.srcElement.getAttribute("iframevisualbinding");

            // find the iframeVisual that generated the user action
            for (var v = 0; v < IFrameVisual.instances.length; v++)
            {
                var curInstance = IFrameVisual.instances[v];
                if (curInstance.GUID === allowForGUID)
                {
                    curInstance.isAllowedByUser = true;
                    curInstance.draw();
                    break;
                }
            }
        }
        private handleAllowAlwaysClick(d: any, i: any) {
            // now in the context of the button that was clicked
            var allowForGUID = d3.event.srcElement.getAttribute("iframevisualbinding");
            var rootUrl = d3.event.srcElement.getAttribute("iframeVisualRootUrl");
            IFrameVisual.AllowUrlAlways(rootUrl);

            // find the iframeVisual that generated the user action
            for (var v = 0; v < IFrameVisual.instances.length; v++) {
                var curInstance = IFrameVisual.instances[v];
                if (curInstance.GUID === allowForGUID) {
                    curInstance.isAllowedByUser = true;
                    curInstance.draw();
                    break;
                }
            }
        }
		
		private updateData(inDataViews: any)
		{
			//clear data
			this.data = [];
            var curDV = null;
            //var cat = null;
			
			// convert from dataView to array of IFrameVisualData
			if(inDataViews && inDataViews.length > 0)
			{
				if(inDataViews[0].categorical)
				{
					//curDV = inDataViews[0];
                    curDV = inDataViews[0].categorical;
				}
			}

            //cat = curDV.categorical.categories[0];

			// get number of columns
			//var numCols = inDataViews[0].metadata.columns.length;
            //var numCols = 2;
			// returns true if is category: options.dataViews[0].metadata.columns[0].roles.Category
			// returns true if is category: options.dataViews[0].categorical.categories[0].source.roles.Category
			//returns the number of rows
			//var numRows = inDataViews[0].table.rows.length;
			
            var numRows = inDataViews[0].categorical.categories[0].values.length;

			//returns the values of the Nth row
			//options.dataViews[0].table.rows[n]
			
			//process rows
			for (var n=0;n<numRows;n++)
			{
				var curDatum: IFrameVisualDataNode = 
				{
					label: "",
					url: "",
					color: "",
					selected: false,
					//identity: childIdentity,  //ref treemap
                    //identity: inDataViews[0].table.identity[n],
                    //identity: SelectionId.createWithId(cat.identity[n]), //.getSelector(),
                    identity: null,
					tooltipInfo: null,
					highlightedTooltipInfo: null,
				};
				
				//curDatum.identity = inDataViews[0].table.identity[n]

				//var objArray = inDataViews[0].table.rows[n];
                var objArray = curDV.values[0];
				
                for (var m = 0; m < numRows; m++)
                {
                    curDatum.url = objArray.values[m];
                }

                /*
				for(var m=0;m<numCols;m++)
				{
					if(m===0)
					{
						curDatum.label = objArray[m];
						if(numCols === 1)
						{
							curDatum.url = objArray[m];
						}
					}
					else if (m===1)
					{
						curDatum.url = objArray[m];
					}
				}
                */
				this.data.push(curDatum);
			}
			
			// returns the identity for the Nth rowCount
			// options.dataViews[0].table.identity[n]
			
			if(!curDV)
			{
			this.data = [];
			return; //TODO do something better
			}

			// apply selection to data
			if (this.interactivityService) {
                this.hasSelection = this.interactivityService.applySelectionStateToData(this.data);
            }
		}
    }
	
	export interface IFrameVisualDataNode extends SelectableDataPoint {
		label: string;
		url: string;
    }

    export interface IFrameVisualUrl {
        url: string;
        rootUrl: string;
        isWebUrl: boolean;
    }
}

module powerbi.visuals.plugins {
	export var IFrameChart: IVisualPlugin = {
		name: 'IFrameChart',
		class: 'IFrameVisual',
		capabilities: IFrameVisual.capabilities,
		create: () => new IFrameVisual()
	};
}