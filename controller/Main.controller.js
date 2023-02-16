sap.ui.define([
  "./BaseController",
  "sap/m/MessageBox",
	"sap/ui/model/json/JSONModel"
], function (BaseController, MessageBox, JSONModel) {
  "use strict";

  return BaseController.extend("ui5.hft.portal.controller.Main", {
	onInit: function() {
		// apply content density mode to root view
		this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		console.log("Geladen App")
		
		// You can choose the source of the apps to be listed by uncommenting the respective line
		// Search apps folder (simple)
		
		// Seach apps folder (and definition files in appfolders)
		
		// JSONmodel (saved in model folder)
	  this.getAppModel();
		
		// Demodefinition below
		
		// Custom Source (i.e. from an API)
	  },
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
		//var form = this.getView().byId("id223");
		//console.log(form);
		//form.addItem(tile);
		//var form1 = this.getView().byId("grid1");
		//form1.addItem(tile);
		this.addTile("grid1","Gridlover");
		this.addTile("id223","Testapp");
    },
    onUserPress: function() {
		// temporary
		//this.addSection("id223","Hallo");	
		console.log("User");
		var appcollection=new JSONModel("model/apps.json")
		var that=this;
		appcollection.attachRequestCompleted(function(){	
			// Get the apps as just loaded.
			var apps=appcollection.getProperty("/appcollection");
			// take all "groups" within the apps array of objects
			var groups=apps.map(function(app){return app.group});
			// remove duplicates
			var uniquegroups=groups.filter(function(item, pos) {
				return groups.indexOf(item) == pos;
			});
			console.log(uniquegroups);
			// Create the sections according to the groups
			uniquegroups.forEach(function(group){
				console.log(group);
				that.addSection(group.replace(/\s/g, ''),group,that);
			});
			// Create the Apps in the sections
			apps.forEach(function(app){
				console.log(app);
				that.addTile(app.group.replace(/\s/g, ''),app,that);
			});

		});
		//var firstapp=new JSONModel(appcollection.getProperty("appcollection/0"))
			//jQuery.sap.getModulePath("ui5.hft.portal", "/path/to/file.json"));
		//appcollection.loadData("model/apps.js");
		//console.log(appcollection);
		//console.log(appcollection.getMetadata());
		//console.log(appcollection.getProperty("/appcollection"));
    }
	
	// Login
	// Logout
	// Set Variables
	// Delete Variables
	// Klick and Open an App
	
  });

});
