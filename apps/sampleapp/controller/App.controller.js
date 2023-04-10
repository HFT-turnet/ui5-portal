sap.ui.define([
  "./BaseController",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
  "use strict";

  return BaseController.extend("ui5.hft.portalappsample.controller.App", {
    onInit: function() {
	  // The app is generally designed as needed. The only section, that provides a bridge to the portal
	  // Is this init function. It receives the token and the settings from the portal and stores them in a model.
	
      // apply content density mode to root view
      this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
	  
	  // Check for available settings, tokens and data.
	  var token=sessionStorage.token;
	  //var settings = new JSONModel();
	  //settings.setJSON(sessionStorage.xsettings);
	  //console.log(settings);
	  //this.getView().setModel(settings,"settings");
	  
	// SET absolute Portal Path for back-button.

	  // Sources: localStorage and sessionStorage.
	  
	  //localStorage.ft_user="Test";
	  //console.log(localStorage.ft_token);
	  //console.log(sessionStorage.ft_secret);
	  //console.log(localStorage.token);
	  //console.log(sessionStorage.xmodel)

	  //console.log(model);
    }
  });

});
