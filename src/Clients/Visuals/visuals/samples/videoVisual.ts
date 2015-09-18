/*
*  Video Sample visual 
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
	export class VideoVisual implements IVisual {
	
	// how to validate these are correct?
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
		private iframeGUID: string;
		private iframeString: string;
		private iframeUrl: string;
		private data: VideoVisualDataNode[];
		private selected: VideoVisualDataNode[];
		private hasSelection: boolean;
		private interactivityService: IInteractivityService;
        private hostServices: IVisualHostServices;

		constructor() {
			this.iframeGUID = "iframe_" + Math.random() * 100000000000000000000; 
			this.iframeUrl = "https://www.youtube.com/embed/3WCJsCFQGOw";
			this.iframeString = "<iframe width=\"{0}\" height=\"{1}\" src=\"{2}\" frameborder=\"0\" allowfullscreen></iframe>";
			this.data = []; //empty array.
		}

		public init(options: VisualInitOptions) {
            this.element = options.element;
            this.viewport = options.viewport;
			this.interactivityService = VisualInteractivityFactory.buildInteractivityService(options);
            this.hostServices = options.host;
			this.hasSelection = false;
			this.draw();
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
		
		private draw()
		{
			var width = this.viewport.width;
			var height = this.viewport.height;
			
			
			if(!this.iFrame)
			{
				// init
				// iframeString = "<iframe width=\"{0}\" height=\"{1}\" src=\"{2}\" frameborder=\"0\" allowfullscreen></iframe>";

				var curIFrame = d3.select(this.element.get(0)).append("iframe");
				curIFrame
					.attr("width", width)
					.attr("height", height)
					.attr("id", this.iframeGUID)
					.attr("frameborder", 0)
					.attr("allowfullscreen")
					;
					
				this.iFrame = curIFrame;
			}
			else
			{
				this.iFrame
					.attr("width", width)
					.attr("height", height);
			}

			if(!this.self)
			{
				this.self = d3.select(this.element.get(0));
			}

			// attempt to make a smoother loading experience (hint:failed)
			
			if(this.data.length === 0 ) {
				this.iFrame
					.attr("src", this.iframeUrl);
			}
			else{
				// set URL 
				var inURL = this.data[0].url;
				inURL = inURL;	
				
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
		}
		
		private updateData(inDataViews: any)
		{
			//clear data
			this.data = [];
            var curDV = null;
            //var cat = null;
			
			// convert from dataView to array of VideoVisualData
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
				var curDatum: VideoVisualDataNode = 
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
	
	export interface VideoVisualDataNode extends SelectableDataPoint {
		label: string;
		url: string;
	}
}

module powerbi.visuals.plugins {
	export var VideoChart: IVisualPlugin = {
		name: 'VideoChart',
		class: 'VideoVisual',
		capabilities: VideoVisual.capabilities,
		create: () => new VideoVisual()
	};
}