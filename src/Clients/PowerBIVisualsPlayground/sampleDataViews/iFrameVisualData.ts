/*
*  IFrame Sample visual sample data
*
*  Copyright (c) Lukasz Pawlowski @lukasztweets
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
*  THE SOFTWARE.
*/

/// <reference path="../_references.ts"/>

module powerbi.visuals.sampleDataViews {
    import DataViewTransform = powerbi.data.DataViewTransform;
    
    export class IFrameVisualData extends SampleDataViews implements ISampleDataViewsMethods {

        public name: string = "IFrameVisualData";
        public displayName: string = "Power BI Videos from YouTube data";

        public visuals: string[] = ['IFrameChart'];

        private values: Array<string> = ["https://www.youtube.com/embed/kULc2VbwjCc"];

        public getDataViews(): DataView[] {
            var fieldExpr = powerbi.data.SQExprBuilder.fieldDef({ schema: 's', entity: "table1", column: "video" });

            var categoryValues = this.values; 
            var categoryIdentities = categoryValues.map(function (value) {
                var expr = powerbi.data.SQExprBuilder.equal(fieldExpr, powerbi.data.SQExprBuilder.text(value));
                return powerbi.data.createDataViewScopeIdentity(expr);
            });

            var dataViewMetadata: powerbi.DataViewMetadata = {
                columns: [
                    {
                        displayName: 'IFrame URL',
                        queryName: 'IFrameURL',
                        type: powerbi.ValueType.fromDescriptor({ text: true })
                    }
                ]
            };
            var columns = [
                {
                    source: dataViewMetadata.columns[0],
                    values: categoryValues,
                },
            ];

            var dataValues: DataViewValueColumns = DataViewTransform.createValueColumns(columns);

            return [{
                metadata: dataViewMetadata,
                categorical: {
                    categories: [{
                        source: dataViewMetadata.columns[0],
                        values: categoryValues,
                        identity: categoryIdentities
						/*,
                        objects: [
                            {
                                dataPoint: {
                                    fill: {
                                        solid: {
                                            color: 'rgb(165, 172, 175)'
                                        }
                                    }
                                }
                            },
                            {
                                dataPoint: {
                                    fill: {
                                        solid: {
                                            color: 'rgb(175, 30, 44)'
                                        }
                                    }
                                }
                            },
                        ]
						*/
                    }],
                    values: dataValues,
                },
            }];
        }
        private ordinal: number = 0;
        public randomize(): void {
            var values1 = ["https://www.youtube.com/embed/kULc2VbwjCc", "https://www.youtube.com/embed/Uc6YbSG4vVA", "https://www.youtube.com/embed/pbr9IZTs1rU", "https://www.youtube.com/embed/iFa8JEdWvnI"];
            var values2 = ["ms-pbi://https://www.youtube.com/embed/kULc2VbwjCc"];
            var values3 = ["http://www.microsoft.com/@http://www.bing.com?Foo=bar"];

            if (this.ordinal === 0)
            { this.values = values2; this.ordinal = 1;}
            else if (this.ordinal === 1)
            { this.values = values3; this.ordinal = 2;}
            else
            { this.values = values1; this.ordinal = 0;}

        }
        
    }
}