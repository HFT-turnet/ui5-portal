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
			// Check login-obligation (islogin via token / loginname)
			if (config.getProperty("/Portal/LoginForced")==true){
				// Now all logic to ensure login is performed first happens
				if (xmodel.getProperty("/Status/Loggedin")==false){
					that.onOpenLoginDialog();
				}

				// AFTER LOGIN CHECK PERFORM SAME ACTIVITIES AS UNDER ELSE
				// maybe alternatively work with "return"
			} else {
				// No forced login, Settings and Apps can be generated as defined.
				// Get the Apps
				that.getAppModel(config.getProperty("/Portal/AppSource"),config.getProperty("/Portal/AppGetPath"));
				// Get Base Settings, if applicable
				if (config.getProperty("/Portal/Settings")==true){
					var settings=that.getSettingsModel(config.getProperty("/Portal/SettingsSource"),config.getProperty("/Portal/SettingsGetPath"));
					//console.log(settings);
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
		sessionStorage.xmodel=xmodel.getJSON();
		//console.log(sessionStorage.xmodel);
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
				//configs.setProperty("/Current/BkrNumberName", tokenModel.getProperty("/bkrnumbername"));
				//configs.setProperty("/Current/BkrId", tokenModel.getProperty("/bkrid"));
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
				//location.reload();
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
			BusyIndicator.show();
			console.log("Setting");
			
			var oView = this.getView();	
			var oDialog = oView.byId("SettingDialog");
         	// create dialog lazily
         	if (!oDialog) {
            	// create dialog via fragment factory
            	oDialog = sap.ui.xmlfragment(oView.getId(), "ui5.hft.portal.view.SettingDialog", this);
            	oView.addDependent(oDialog);
         		}
 			oDialog.open();
			BusyIndicator.hide();
			this.settingGenerateFields();
			},
	
	settingGenerateFields: function() {
			// to implement: only for the first time. After that the view is established
		
			var settingmodel=this.getModel("settings");			
			var fields = settingmodel.getProperty("/Meta/");			
			Object.keys(fields).forEach((field) => {
				// Create Label
				this.settingCreateLabel(field, fields[field]);
				// Get current value, if exists
				var value="";
				// Get from current Settings
				if (value==""){value};
				// Get from defaults via API / File
				if (value=="") {value=settingmodel.getProperty("/Values/")[field];}
				// Create Field dependent on type
				if (fields[field].type.slice(0, 5)=="input"){this.settingCreateInput(field, fields[field], value)};
				if (fields[field].type=="checkbox"){this.settingCreateCheckbox(field, fields[field], value)};
				if (fields[field].type=="dropdown"){this.settingCreateDropdown(field, fields[field], value)};
				});
			},
			
	settingCreateLabel: function(key, field) {
			//console.log(key);
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
			// Iterate over the dropdown items.
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
	
	onTest: function(){

	},
			
	onSelectChange: function(oEvent){
			var settingmodel=this.getModel("settings");		
			// There is a configuration option to reload value helps and the settings overall, if a drop-down is changed.
			// This function picks that up. If the setting is not set, it does not do anything.
			//console.log(oEvent.getParameters());
			
			if (settingmodel.getProperty("/Meta/" + oEvent.getParameters().id.slice(6)).requirerefresh==true){
				console.log("I need to reload");
			}
			
	},
			
	onCloseSettingDialog : function() {
			// Update all Variables and the XModel
			var xmodel = this.getModel("xmodel");
			this.xmodelToSessionstorage();
			var xmodelsession=JSON.parse(sessionStorage.xmodel)
			var settings=xmodelsession["Settings"]
			var frameitems=this.getView().byId("settingframe").getContent();
	
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
				settings[key]=value
			}
		   });
		   // Write back to session and xmodel
		   xmodelsession["Settings"]=settings;
		   sessionStorage.xmodel=JSON.stringify(xmodelsession);
		   xmodel.setJSON(JSON.stringify(xmodelsession));
			this.getView().byId("SettingDialog").close();
			// Check API Mode & Consequence like push to API
			//..
	}
  });
});
