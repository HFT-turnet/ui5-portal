sap.ui.define([
  "./BaseController",
  "sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	'sap/ui/core/BusyIndicator'
], function (BaseController, MessageBox, JSONModel, BusyIndicator) {
  "use strict";

  return BaseController.extend("ui5.hft.portal.controller.Main", {
	onInit: function() {
		// apply content density mode to root view
		this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		console.log("Geladen App")
		
  		// JSONmodel (saved in model folder)
	  	this.getAppModel();
		
		// Demodefinition below
		
		// Custom Source (i.e. from an API)
	  },
	  
	onTilePress: function (evt) {
			// Get Target Frame
			var module = evt.getSource().getUrl();
			console.log(module);
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo(module);
		},
	
    onSettingPress: function() {
		BusyIndicator.show();
		BusyIndicator.hide();
		console.log("Setting");
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
			var path = configs.getProperty("/Portal/Backendbase") + "/" + configs.getProperty("/Portal/Loginpath");
			var oHeaders = {
				"Content-Type": "application/x-www-form-urlencoded"
			};
			var params="login=" + login + "&password=" + password;
			tokenModel.loadData(path, params, false, "POST", null, false, oHeaders);
						
			//tokenModel[0].getProperty("/access_token");
			//console.log(tokenModel);
			//console.log(tokenModel.getProperty("/access_token"));
			
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
				//this.setdata();
				localStorage.token = tokenModel.getProperty("/access_token");
				//location.reload();
			};
			// Close Box & Reload Page
			this.getView().byId("LoginDialog").close();
			// Re-Initialize
			//this.onInit();
			}
	
  });

});
