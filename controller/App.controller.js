sap.ui.define([
  "./BaseController"
], function (BaseController) {
  "use strict";

  return BaseController.extend("ui5.hft.portal.controller.App", {
    onInit: function() {
      // apply content density mode to root view
      this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
	  console.log("Geladen App")
	  
	  // You can choose the source of the apps to be listed by uncommenting the respective line
	  // Search apps folder (simple)
	  
	  // Seach apps folder (and definition files in appfolders)
	  
	  // JSONmodel (saved in model folder)
    //this.getAppModel();
	  
	  // Demodefinition below
	  
	  // Custom Source (i.e. from an API)
    }
  });
});
