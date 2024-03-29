sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/UIComponent",
  "sap/ui/core/routing/History",
  "sap/ui/model/json/JSONModel"
], function (Controller, UIComponent, History, JSONModel) {
  "use strict";

  return Controller.extend("ui5.hft.portal.controller.BaseController", {
	// Standard template Base Controller Functions
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

	// XMODEL Functions
	xmodelFromSessionstorage: function() {
		// Xmodel has been established from scaffold. This is to load the data from sessionstorage into xmodel.
		var xmodel = this.getModel("xmodel");
		if (!(sessionStorage.xmodel===undefined)) {
			xmodel.setJSON(sessionStorage.xmodel)
			} else {
				// if the sessionstorage is undefined but there is a token - try to retrieve login data.
				if (!(sessionStorage.token===undefined || sessionStorage.token=="")) {
					this.xmodelGetUserdata();
				}
			}
	},
	
	xmodelToSessionstorage: function() {
		// Save the xmodel-data to session storage.
		var xmodel = this.getModel("xmodel");
		sessionStorage.xmodel=xmodel.getJSON();
	},
	
	xmodelGetUserdata: function(){
		// If there is a token, but no further information, Call out to the API to obtain userdata again. If this is not successful, destroy the token reference.
		// Users who do not have this function in the API need to uncomment this in xmodelFromSessionStorage, because it would always lead to the token being deleted.
		var configs = this.getModel("configs");
		var xmodel = this.getModel("xmodel");
		
		var userdata = new JSONModel();
		var path = configs.getProperty("/Portal/Backendbase") + "/" + configs.getProperty("/Portal/CurrentUserPath");
		var oHeaders = {
		    "Authorization": "Bearer " + sessionStorage.token
			};
		userdata.loadData(path, null, true, "GET", null, false, oHeaders);
		userdata.attachRequestCompleted(function(){
			if (userdata.getObject("/login")) {
				xmodel.setProperty("/User/Token", sessionStorage.token);
				xmodel.setProperty("/Status/Loggedin", true);
				xmodel.setProperty("/User/Id", userdata.getProperty("/id"));
				xmodel.setProperty("/User/Login", userdata.getProperty("/login"));
				if (userdata.getProperty("/name")){
					xmodel.setProperty("/User/Name", userdata.getProperty("/name"));
				} else {
					xmodel.setProperty("/User/Name", userdata.getProperty("/login"));
				};
				xmodel.refresh;
				sessionStorage.xmodel=xmodel.getJSON();
			} else {
				// If we do not get a valid login back, it is likely the token is unvalid.
				sessionStorage.removeItem('token');
			}
		})
	},
	
	// SETTINGS Functions
	getSettingsModel: function(source,sourcepath){
		var configs = this.getModel("configs");
		if (source=="file"){
			var settings=new JSONModel("model/settings.json");
			// Works with "this" because the model is only being defined.
			this.setModel(settings,"settings");
		};
		if (source=="api"){
			var settings=new JSONModel();
			var oHeaders = {
			    "Authorization": "Bearer " + sessionStorage.token
				};
			var path = configs.getProperty("/Portal/Backendbase") + "/" + sourcepath;
			console.log(path);
			settings.loadData(path, null, true, "GET", null, false, oHeaders);
			this.setModel(settings,"settings");
		};
		return settings;
	},

	syncSettings: function(precedence){
		// Xmodel and Settings must be set. precedence defines which model is the master.
		// In run, the XModel is the lead, settings sould not be directly referenced.
		var xmodel = this.getModel("xmodel");
		this.xmodelToSessionstorage();
		var xmodelsession=JSON.parse(sessionStorage.xmodel);
		var settingsinxmodel=xmodelsession["Settings"];
		//console.log(settingsinxmodel);

		var settings = this.getModel("settings");
		var fields = settings.getProperty("/Meta/");
		// Go through each of the fields and check their existence in xmodel.
		// If the field is not mentioned => create with value from settings.
		// If the field exists, the "precedence" decides which value is taken.		
		Object.keys(fields).forEach((field) => {
			// Xmodel does not contain the field
			if (!settingsinxmodel[field]) {
				// We set the settingsourcevalue.
				settingsinxmodel[field]=settings.getProperty("/Values/")[field];
			}
			// Xmodel contains the field
			if (settingsinxmodel[field]) {
				// Precedence is settings
				if (precedence=="settings") {
					settingsinxmodel[field]=settings.getProperty("/Values/")[field];
				}
			}
		// Write back the updated xmodel to xmodel and sessionstorage.
		xmodelsession["Settings"]=settingsinxmodel;
		sessionStorage.xmodel=JSON.stringify(xmodelsession);
		xmodel.setJSON(JSON.stringify(xmodelsession));
		// We do not adjust the settingmodel, it is only leading for metadata and during sync.
		});
	},
	
	apipushSettings: function(){
		// This function pushes the settings to the API.
		var configs = this.getModel("configs");
		var xmodelsession=JSON.parse(sessionStorage.xmodel);
		var settingsinxmodel=xmodelsession["Settings"];
		var settingapi=new JSONModel();
		var oHeaders = {
			"Authorization": "Bearer " + sessionStorage.token
			};
		var path = configs.getProperty("/Portal/Backendbase") + "/" + configs.getProperty("/Portal/SettingsPostPath");
		//console.log(path);
		settingapi.loadData(path, settingsinxmodel, true, "POST", null, false, oHeaders);
	},

	// APP Functions

	getAppModel: function(source, sourcepath){
		//var configs = new JSONModel();
		var configs = this.getModel("configs");
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
			var oHeaders = {
			    "Authorization": "Bearer " + sessionStorage.token
				};
			var path = configs.getProperty("/Portal/Backendbase") + "/" + sourcepath;
			appcollection.loadData(path, null, true, "GET", null, false, oHeaders);
			var that=this;
			appcollection.attachRequestCompleted(function(){
				//Only continue with appcollections
				if (!(appcollection.getProperty("/appcollection")===undefined)){
					that.loadApps(appcollection.getProperty("/appcollection"), that);
				}
			});
		}

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
	},
	
	resetApps: function(){
		this.getView().byId("portal").destroyContent();
	} 
	
  });

});
