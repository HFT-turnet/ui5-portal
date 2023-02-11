sap.ui.define([
  "./BaseController",
  "sap/m/MessageBox"
], function (BaseController, MessageBox) {
  "use strict";

  return BaseController.extend("ui5.hft.portal.controller.Main", {
	  
    onSettingPress: function() {
		console.log("Setting");
		// Add a tile.
		//var form = this.getView().byId(this.createId("grid1"));
		
		// Add a section (outer loop)
		
		// Add tiles (inner loop) 
		// Define a new tile
		var tile=new sap.m.GenericTile({
		                    header : "text1",
					   		subheader: "Minitest",
					   	 	press: "notimplemented",
					   		url: "#"
		                })
		tile.setLayoutData(new sap.f.GridContainerItemLayoutData({
				minRows:2,
				columns:2}));
		// Add Icon and Footer to tile
		tile.addTileContent(
			new sap.m.TileContent({
				footer: "footertext"
			})
			.setContent(new sap.m.ImageContent({
				src: "sap-icon://time-overtime"
				}))
			);
		// OR: add KPI and trend to tile
		tile.addTileContent(
			new sap.m.TileContent({
				footer: "footertext",
				unit: "EUR"
			})
			.setContent(new sap.m.NumericContent({
				value: 1000,
				scale: "M",
				valueColor: "Error",
				indicator: "Up" 
				}))
			);
		console.log(tile);
		var form = this.getView().byId("grid1");
		form.addItem(tile)
    },
    onUserPress: function() {
		console.log("User");
    }
  });

});
