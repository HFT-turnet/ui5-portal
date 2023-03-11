sap.ui.define([
  "./BaseController"
], function (BaseController) {
  "use strict";

  return BaseController.extend("ui5.hft.portalappsample.controller.App", {
    onInit: function() {
      // apply content density mode to root view
      this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
	  
	  // Check for available settings, tokens and data.
	  // Sources: localStorage and sessionStorage.
	  
	  localStorage.ft_user="Test";
	  console.log(localStorage.ft_token);
	  console.log(sessionStorage.ft_secret);
	  console.log(localStorage.token);
    }
  });

});
