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

	getAppModel: function(){
		var appcollection=new JSONModel("model/apps.json")
		var that=this;
		appcollection.attachRequestCompleted(function(){
			that.loadApps(appcollection.getProperty("/appcollection"), that);
		});
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
		//console.log(uniquegroups);
		// Create the sections according to the groups
		uniquegroups.forEach(function(group){
			//console.log(group);
			that.addSection(group.replace(/\s/g, ''),group,that);
		});
		// Create the Apps in the sections
		appcollection.forEach(function(app){
			that.addTile(app.group.replace(/\s/g, ''),app,that);
		});
	},

	addSection: function(sectionid, sectionname,that){
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
		var tile=new sap.m.GenericTile({
		                    header : tiledata.header,
					   		subheader: tiledata.subheader,
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
		var form = that.getView().byId(sectionid);
		//console.log(form);
		form.addItem(tile);
	}
	
  });

});
