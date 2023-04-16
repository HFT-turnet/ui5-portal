sap.ui.define([
  "./BaseController",
  "sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	'sap/ui/core/BusyIndicator'
], function (BaseController, MessageBox, JSONModel, BusyIndicator) {
  "use strict";


  //NOTE FOR NEXT STEPS:
  // If this is done. Define what to put in xmodel and structure it with login
  // Clarify which part of the model declares "logged in" status at init
  // Determine how settings are to be handed over
  // Fix the Init: xmodel, configs, procedure, settings load.

  return BaseController.extend("ui5.hft.portal.controller.Main", {
	onInit: function() {
		// Instantiate the Xmodel
		this.createXModel();
		// apply content density mode to root view
		this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		console.log("Geladen Main");
		// Models can only be instantiated, not manipulated during init.

		// Bootsteps: a) Get Config to determine login-forced. 
		// b) check whether token and loginname is available. c) if not, show login dialog. 
		// d) if yes, get data and show app.

		// Get Configs for the App
		var config=new JSONModel("model/config.json");
		var that=this;
		config.attachRequestCompleted(function(){
			that.setModel(config,"config");
			// Check login-obligation (islogin via token / loginname)
			if (config.getProperty("/Portal/LoginForced")==true){
				// Now all logic to ensure login is performed first happens
				console.log("True Force")

				// AFTER LOGIN CHECK PERFORM SAME ACTIVITIES AS UNDER ELSE
				// maybe alternatively work with "return"
			} else {
				// No forced login, Settings and Apps can be generated as defined.
				// Get the Apps
				that.getAppModel(config.getProperty("/Portal/AppSource"),config.getProperty("/Portal/AppGetPath"));
				// Get Base Settings, if applicable
				if (config.getProperty("/Portal/Settings")==true){
					var settings=that.getSettingsModel(config.getProperty("/Portal/SettingsSource"),config.getProperty("/Portal/SettingsGetPath"));
					console.log(settings);
				};
			};
		});
	  },

	setXModel: function(){
		console.log("Set Xmodel");
		var xmodel=this.getModel("xmodel");
		xmodel.setProperty("/Status","Hallo Welt");
		//xmodel.oData.Statu="Hallo Welt";
		//xmodel.refresh();
		//this.getView().setModel(xmodel,"xmodel");
		//console.log("XX");
		//console.log(xmodel.getProperty("/Status"));
		console.log(xmodel.oData.Status);
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
	
    onSettingPress: function() {
		this.setXModel();
		BusyIndicator.show();
		BusyIndicator.hide();
		console.log("Setting");
		var xmodel=this.getModel("xmodel");
		console.log(xmodel.getJSON());
    },
	
	onOpenLoginDialog : function () {
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
	
	onCloseLoginDialog : function () {
			this.getView().byId("LoginDialog").close();
			},
			
	performLogin : function () {
			// Get Status of Configuration
			var configs = new JSONModel();
			configs = this.getModel("configs");
			//console.log("Configs Before");
			//console.log(configs);
			
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
				configs.setProperty("/User/Token", tokenModel.getProperty("/access_token"));
				//configs.setProperty("/User/Userid", tokenModel.getProperty("/userid"));
					//configs.setProperty("/Current/BkrNumberName", tokenModel.getProperty("/bkrnumbername"));
				//configs.setProperty("/Current/BkrId", tokenModel.getProperty("/bkrid"));
				configs.setProperty("/User/Login", login);
				if (tokenModel.getProperty("/username")){
					configs.setProperty("/User/Name", tokenModel.getProperty("/username"));
				} else {
					configs.setProperty("/User/Name", login);
				};
				configs.refresh
				console.log(configs);
				//this.setdata();
				sessionStorage.token = tokenModel.getProperty("/access_token");
				//location.reload();
			};
			// Close Box & Reload Page
			this.getView().byId("LoginDialog").close();
			// Re-Initialize
			//this.onInit();
			}
	
  });
});
