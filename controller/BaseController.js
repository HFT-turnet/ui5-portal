sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/UIComponent",
  "sap/ui/core/routing/History",
  "sap/ui/model/json/JSONModel"
], function (Controller, UIComponent, History, JSONModel) {
  "use strict";

  return Controller.extend("ui5.hft.portal.controller.BaseController", {
    getOwnerComponent: function() {
      return Controller.prototype.getOwnerComponent.call(this);
    },
    getRouter: function() {
      return UIComponent.getRouterFor(this);
    },
    getResourceBundle: function() {
      const oModel = this.getOwnerComponent().getModel("i18n");
      return oModel.getResourceBundle();
    },
    getModel: function(sName) {
      return this.getView().getModel(sName);
    },
    setModel: function(oModel, sName) {
      	this.getView().setModel(oModel, sName);
		return this;
    },
	createXModel: function(){
		//var content='{"Status":"", "Settings":"", "Portalpath":"empty"}';
		//console.log(content);
		var xmodel=new JSONModel("model/xmodel.json");
		//xmodel.setJSON(content);
		this.getView().setModel(xmodel,"xmodel");
		//console.log(xmodel);
		return this;
	},
    navTo: function(sName, oParameters, bReplace) {
      this.getRouter().navTo(sName, oParameters, undefined, bReplace);
    },
    onNavBack: function() {
      const sPreviousHash = History.getInstance().getPreviousHash();
      if (sPreviousHash !== undefined) {
        window.history.go(-1);
      } else {
        this.getRouter().navTo("main", {}, undefined, true);
      }
    },

	getAppModel: function(source, sourcepath){
		console.log(source);
		if (source=="file"){
			var appcollection=new JSONModel("model/apps.json")
			var that=this;
			appcollection.attachRequestCompleted(function(){
				that.loadApps(appcollection.getProperty("/appcollection"), that);
			});
		}
		if (source=="api"){
			var appcollection=new JSONModel()
			
			// ADD API CALL TO OBTAIN DATA

			var that=this;
			appcollection.attachRequestCompleted(function(){
				that.loadApps(appcollection.getProperty("/appcollection"), that);
			});
		}

	},
	getSettingsModel: function(source,sourcepath){
		if (source=="file"){
			var settings=new JSONModel("model/settings.json");
			// Works with "this" because the model is only being defined.
			this.setModel(settings,"settings");
		};
		if (source=="api"){
			var settings=new JSONModel();

			// ADD API CALL TO OBTAIN DATA

			this.setModel(settings,"settings");
			
		};
		return settings;
	},

	loadApps: function(appcollection, that){
		// This is a function to fetch the apps from the appcollection and create the sections and tiles.
		// The purpose of separating this function is to make it easier to change the source of the apps.
		// take all "groups" within the apps array of objects
		var groups=appcollection.map(function(app){return app.group});
		// remove duplicates
		var uniquegroups=groups.filter(function(item, pos) {
			return groups.indexOf(item) == pos;
		});
		// Search the array and replace "undefined" with "Generic"
		for (var i = 0; i < uniquegroups.length; i++) {
			if (uniquegroups[i] === undefined) {
				uniquegroups[i] = "Generic";
			}
		};
		//console.log(uniquegroups);
		// Create the sections according to the groups
		uniquegroups.forEach(function(group){
			//console.log(group);
			that.addSection(group.replace(/\s/g, ''),group,that);
		});
		// Create the Apps in the sections
		appcollection.forEach(function(app){
			// First check if the tiledata is sufficient or needs enhancing to work.
			app=that.checktile(app);
			that.addTile(app.group.replace(/\s/g, ''),app,that);
		});
	},

	addSection: function(sectionid, sectionname, that){
		// This is a function to create a section in the portal
		// It receives a new section id, a section name and the view reference to work independent from the initial view.
		// A bar with the title and a grid container are created. The grid container holds the id of the section.
		var bar= new sap.m.Bar();
		bar.addContentLeft(new sap.m.Label( {text: sectionname}));
		that.getView().byId("portal").addContent(bar);	
		var gridcontainer=new sap.f.GridContainer(this.getView().createId(sectionid),{snapToRow: true}).addStyleClass("sapUiSmallMargin");
		gridcontainer.setLayout(new sap.f.GridContainerSettings({rowSize: "84px", columnSize: "84px", gap: "8px"}))
		gridcontainer.setLayoutXS(new sap.f.GridContainerSettings({rowSize: "70px", columnSize: "70px", gap: "8px"}))		
		that.getView().byId("portal").addContent(gridcontainer);
	},
	
	addTile: function(sectionid, tiledata, that){
		// This is a function to create a tile in the portal in a specific section.
		// It receives the section id, the tile data and the view reference to work independent from the initial view.
		// Create the tile
		var tile=new sap.m.GenericTile({
		                    header : tiledata.header,
					   		subheader: tiledata.subheader,
							url: "apps/"+tiledata.appname
		                });
		// Assign Function for click on tile.
		tile.attachPress("",this.onPress);
		tile.setLayoutData(new sap.f.GridContainerItemLayoutData({
				minRows:2,
				columns:2}));
		// Apps are either KPI or Icon Apps
		// If clause to check if the app is a KPI or Icon App via the field "kpitrue
		//console.log(tiledata.kpitrue);
		if (tiledata.kpitrue==1){
			// Add KPI and trend to tile
			tile.addTileContent(
				new sap.m.TileContent({
					footer: tiledata.footer,
					unit: tiledata.unit
				})
				.setContent(new sap.m.NumericContent({
					value: tiledata.value,
					scale: tiledata.scale,
					valueColor: tiledata.valuecolor,
					indicator: tiledata.indicator
					}))
				);
		} else {
		// Add Icon and Footer to tile
			tile.addTileContent(
				new sap.m.TileContent({
					footer: tiledata.footer
				})
				.setContent(new sap.m.ImageContent({
					src: "sap-icon://"+tiledata.sapicon
					}))
				);
		};
		var form = that.getView().byId(sectionid);
		form.addItem(tile);
	},

	checktile: function(tiledata){
		// This is a function to check if the tiledata is sufficient or needs enhancing to work.
		// It receives the tile data and returns the tile data.
		// If the tiledata is not sufficient, the function will add the missing fields with default values.

		// Check if the tiledata has a kpitrue. If not, change a number of fields.
		if (tiledata.kpitrue==undefined){
			tiledata.kpitrue=0;
			tiledata.sapicon="action";
			tiledata.subheader="App";
			tiledata.header=tiledata.appname.charAt(0).toUpperCase() + tiledata.appname.slice(1);
			tiledata.id=tiledata.appname;
			tiledata.group="Generic"
		};
		return tiledata;
	}	 
	
  });

});
