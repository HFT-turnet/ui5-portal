sap.ui.define([
  "./BaseController",
  "sap/m/MessageBox"
], function (BaseController, MessageBox) {
  "use strict";

  return BaseController.extend("ui5.hft.portalappsample.controller.Main", {
    onHomePress: function() {
			window.open("../../#","_self");
    },
    sayHello: function() {
      MessageBox.show("Hello World!");
    }
  });

});
