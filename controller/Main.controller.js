sap.ui.define([
  "./BaseController",
  "sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	'sap/ui/core/BusyIndicator'
], function (BaseController, MessageBox, JSONModel, BusyIndicator) {
  "use strict";

  return BaseController.extend("ui5.hft.portal.controller.Main", {
	// GENERAL SETUP AND LOGIN APPS
	  
	onInit: function() {
		// This may be called in different modes:
		// 1 First call, models are the same as in config (same for logout call)
		// 2 Reload of any kind (i.e. after login, refresh or minor)
		// 3 Callback from an app => xmodel might have been adjusted.

		// apply content density mode to root view
		this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		console.log("Geladen Main");
		// Models can only be instantiated, not manipulated during init.

		// Bootsteps: a) Get Config to determine login-forced. 
		// b) check whether token and loginname is available. c) if not, show login dialog. 
		// d) if yes, get data and show app.
		
		// Get Xmodel first: if it does not exist: load sceleton and update with localstorage
		var xmodel = this.getModel("xmodel");
		if (xmodel === undefined){
			var xmodel=new JSONModel("model/xmodel.json");
			this.getView().setModel(xmodel,"xmodel");
			xmodel.attachRequestCompleted(function(){
				that.xmodelFromSessionstorage();
			})
		};

		// Get Configs for the App. Due to loading sequence, the model on the view is not yet available
		var config=new JSONModel("model/config.json");
		var that=this;
		config.attachRequestCompleted(function(){	
			// Load Settings if they exist and source is file
			if ((config.getProperty("/Portal/Settings")==true) && (config.getProperty("/Portal/SettingsSource")=="file")){
				console.log("Settings from file");
				var settings=that.getSettingsModel("file","");
				that.setModel(settings,"settings");
				settings.attachRequestCompleted(function(){
					// Check Settings against xmodel. Xmodel would have precedence.
					that.syncSettings("xmodel");
				});
			};	
			// Check login-obligation (islogin via token / loginname)
			if (config.getProperty("/Portal/LoginForced")==true){
				// Now all logic to ensure login is performed first happens
				if (xmodel.getProperty("/Status/Loggedin")==false){
					that.onOpenLoginDialog();
				}
				// With Login the load of Userdata and Settings is performed. But if we are logged in, it must be triggered.
				if (xmodel.getProperty("/Status/Loggedin")==true){
					that.getAppModel(config.getProperty("/Portal/AppSource"),config.getProperty("/Portal/AppGetPath"));
				}
			} else {
				// No forced login, Settings and Apps can be generated as defined.
				// Get the Apps
				that.getAppModel(config.getProperty("/Portal/AppSource"),config.getProperty("/Portal/AppGetPath"));
				// Get Base Settings, if settings exist and source is API, otherwise see above.
				if ((config.getProperty("/Portal/Settings")==true) && (config.getProperty("/Portal/SettingsSource")=="api")){
					var settings=that.getSettingsModel(config.getProperty("/Portal/SettingsSource"),config.getProperty("/Portal/SettingsGetPath"));
					console.log("Settings from API");
					that.setModel(settings,"settings");
					settings.attachRequestCompleted(function(){
						// Check Settings against xmodel. API Settings would have precedence.
						that.syncSettings("api");
					});
					console.log(settings);
				};
			};
		});
	  },
	  
	onPress: function(evt){
		// Get Target Frame
		var module = evt.getSource().getUrl();
		var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
		//console.log("Pressed");
		//console.log(evt.getSource().getUrl());
		var xmodel=this.getModel("xmodel");
		xmodel.oData.Status="Handover Welt";
		this.xmodelToSessionstorage
		oRouter.navTo(module);
	},
	
	// SECTION ON LOGIN HANDLING
	
	onOpenLoginDialog : function() {
		BusyIndicator.show();
		var oView = this.getView();
		var oDialog = oView.byId("LoginDialog");
		         // create dialog lazily
		         if (!oDialog) {
		            // create dialog via fragment factory
		            oDialog = sap.ui.xmlfragment(oView.getId(), "ui5.hft.portal.view.LoginDialog", this);
		            oView.addDependent(oDialog);
		         }
		 oDialog.open();
		 console.log("Dialog opened");
		 BusyIndicator.hide();
	},
	
	onCloseLoginDialog : function() {
			this.getView().byId("LoginDialog").close();
			},
			
	performLogin : function () {
			var configs = this.getModel("configs");
			var xmodel = this.getModel("xmodel");
			
			// Start Login with Server
			console.log("Start to obtain token");
			var login=this.getView().byId("loginInput").getValue();
			var password=this.getView().byId("passwordInput").getValue();
			
			// Obtain Token and put in config
			var tokenModel = new JSONModel();
			var path = configs.getProperty("/Portal/Backendbase") + "/" + configs.getProperty("/Portal/LoginPath");
			var oHeaders = {
				"Content-Type": "application/x-www-form-urlencoded"
			};
			var params="login=" + login + "&password=" + password;
			tokenModel.loadData(path, params, false, "POST", null, false, oHeaders);
			
			if (tokenModel.getObject("/access_token")) {
				// Save Token & Details to config
				xmodel.setProperty("/User/Token", tokenModel.getProperty("/access_token"));
				xmodel.setProperty("/Status/Loggedin", true);
				xmodel.setProperty("/User/Id", tokenModel.getProperty("/userid"));
				xmodel.setProperty("/User/Login", login);
				if (tokenModel.getProperty("/username")){
					xmodel.setProperty("/User/Name", tokenModel.getProperty("/username"));
				} else {
					xmodel.setProperty("/User/Name", login);
				};
				xmodel.refresh;
				sessionStorage.token = tokenModel.getProperty("/access_token");
				// Save data into session storage.
				this.xmodelToSessionstorage();
				// Reset Apps (remove prior login users apps) and reload app model.
				this.resetApps();
				this.getAppModel(configs.getProperty("/Portal/AppSource"),configs.getProperty("/Portal/AppGetPath"));
				
				// Get Base Settings, only if settings yes and api-mode. Otherwise normal load via file will have happened.
				if ((configs.getProperty("/Portal/Settings")==true) && (configs.getProperty("/Portal/SettingsSource")=="api")){
					var settings=this.getSettingsModel(configs.getProperty("/Portal/SettingsSource"),configs.getProperty("/Portal/SettingsGetPath"));
					console.log("Settings from API");
					this.setModel(settings,"settings");
					var that=this;
					settings.attachRequestCompleted(function(){
						// Sync Settings against xmodel. API Settings would have precedence.
						that.syncSettings("api");
					});
				};
			};
			// Close Box & Reload Page
			this.getView().byId("LoginDialog").close();
			},
			
	logout : function () {
			var configs = this.getModel("configs");
			// Destroy token
			sessionStorage.removeItem('token');
			// Remove Login Information
			var xmodel = this.getModel("xmodel");
			xmodel.setProperty("/User/Token", "");
			xmodel.setProperty("/Status/Loggedin", false);
			xmodel.setProperty("/User/Id", "");
			xmodel.setProperty("/User/Login", "");
			xmodel.setProperty("/User/Name", "");
			xmodel.refresh
			// Destroy sessiondata
			sessionStorage.removeItem('xmodel');
			// Trigger Reload of Apps in Portal as it is possible that API serves apps to not logged in users.
			this.resetApps();
			this.getAppModel(configs.getProperty("/Portal/AppSource"),configs.getProperty("/Portal/AppGetPath"));
			},
	
	// SECTION ON SETTINGS HANDLING
	
	onOpenSettingDialog: function() {
			console.log(this.getModel("settings"));
			BusyIndicator.show();
			console.log("Setting");
			
			var oView = this.getView();	
			var oDialog = oView.byId("SettingDialog");
         	// create dialog lazily
         	if (!oDialog) {
            	// create dialog via fragment factory
            	oDialog = sap.ui.xmlfragment(oView.getId(), "ui5.hft.portal.view.SettingDialog", this);
            	oView.addDependent(oDialog);
				this.settingGenerateFields();
         		}
 			oDialog.open();
			BusyIndicator.hide();
			},
	
	settingGenerateFields: function() {
			var xmodel = this.getModel("xmodel");
			console.log(xmodel);
			var settingmodel=this.getModel("settings");			
			var fields = settingmodel.getProperty("/Meta/");			
			Object.keys(fields).forEach((field) => {
				// Create Label
				this.settingCreateLabel(field, fields[field]);
				// Get current value, if exists
				var value=xmodel.getProperty("/Settings/")[field]
				// Create Field dependent on type
				if (fields[field].type.slice(0, 5)=="input"){this.settingCreateInput(field, fields[field], value)};
				if (fields[field].type=="checkbox"){this.settingCreateCheckbox(field, fields[field], value)};
				if (fields[field].type=="dropdown"){this.settingCreateDropdown(field, fields[field], value)};
				});
			},
			
	settingCreateLabel: function(key, field) {
			var frame=this.getView().byId("settingframe");
			var labelentry= new sap.m.Label("label_"+key,{
							required: field.required,
							text: field.label,
							labelFor: "input_"+key
							});
			frame.addContent(labelentry);
	},
	settingCreateInput: function(key, field, value) {
			var frame=this.getView().byId("settingframe");
			if (field.type=="input_text"){
				var inputentry= new sap.m.Input("input_"+key,{
							type: sap.m.InputType.Text,
							placeholder: field.placeholder
							});
				};
			if (field.type=="input_number"){
				var inputentry= new sap.m.Input("input_"+key,{
							type: sap.m.InputType.Number
							});
				};
			if (field.type=="input_helper"){
				var inputentry= new sap.m.Input("input_"+key,{
							type: sap.m.InputType.Text,
							showSuggestion: true,
							placeholder: field.placeholder
							});
			// Iterate over the suggestion items.
				field.items.forEach((li) => { 
						inputentry.addSuggestionItem(new sap.ui.core.Item({
											key: li.key,
											text: li.text,
											}));
						});
				};
			inputentry.setValue(value);					
			frame.addContent(inputentry);
	},
	
	settingCreateCheckbox: function(key, field, value) {
			var frame=this.getView().byId("settingframe");
			var inputentry= new sap.m.CheckBox("input_"+key,{
								selected: value
										});;
			frame.addContent(inputentry);
	},
	
	settingCreateDropdown: function(key, field, value) {
			var frame=this.getView().byId("settingframe");
			var inputentry= new sap.m.Select("input_"+key,{
								name: key,
								selectedKey: value
								});
			// Iterate over the dropdown items.
			field.items.forEach((li) => { 
					inputentry.addItem(new sap.ui.core.Item({
									key: li.key,
									text: li.text
									}));
								});
			inputentry.attachChange("",this.onSelectChange);
			frame.addContent(inputentry);
	},
	
	onSelectChange: function(oEvent){
			var settingmodel=this.getModel("settings");		
			// There is a configuration option to reload value helps and the settings overall, if a drop-down is changed.
			// This function picks that up. If the setting is not set, it does not do anything.
			//console.log(oEvent.getParameters());
			
			if (settingmodel.getProperty("/Meta/" + oEvent.getParameters().id.slice(6)).requirerefresh==true){
				console.log("I need to reload");
				var xmodelsession=JSON.parse(sessionStorage.xmodel)
				// Replace the triggering setting
				console.log(oEvent.getParameters().id.slice(6));
			}
			
	},
			
	onCloseSettingDialog : function() {
			console.log("Close received");
			// Update all Variables and the XModel
			var xmodel = this.getModel("xmodel");
			this.xmodelToSessionstorage();
			var xmodelsession=JSON.parse(sessionStorage.xmodel)
			var settingsinxmodel=xmodelsession["Settings"]
			var frameitems=this.getView().byId("settingframe").getContent();

			var configs = this.getModel("configs");
	
			frameitems.forEach((item)=> {
				if (item.sId.slice(0, 5)=="input"){
					var type=item.getMetadata().getName();
					var key=item.sId.slice(6)
					switch(type) {
				  		case "sap.m.Input":
				    		var value= item.mProperties.value;
							break;
			  	  	  	case "sap.m.CheckBox":
			    			var value= item.mProperties.selected;
							break;
		  		  	  	case "sap.m.Select":
		    				var value= item.mProperties.selectedKey;
							break;
						}
				// We now update / create the settings hash.
				settingsinxmodel[key]=value
			}
		   });
		   // Write back to session and xmodel
		   xmodelsession["Settings"]=settingsinxmodel;
		   sessionStorage.xmodel=JSON.stringify(xmodelsession);
		   xmodel.setJSON(JSON.stringify(xmodelsession));
			this.getView().byId("SettingDialog").close();
			// Check API Mode & Consequence like push to API
			if (configs.getProperty("/Portal/SettingsRemote")=="true"){
				console.log("Hi There");
				//Push to API
				this.apipushSettings();
			}
	}
  });
});
