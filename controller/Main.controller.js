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
	onTilePress: function (evt) {
			// Get Target Frame
			var module = evt.getSource().getUrl();
			console.log(module);
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo(module);
		},
    onSettingPress: function() {
		console.log("Setting");
    },
    onUserPress: function() {
		console.log("User");
	
	// Login
	// Logout
	// Set Variables
	// Delete Variables
	// Klick and Open an App
	}
	
  });

});
