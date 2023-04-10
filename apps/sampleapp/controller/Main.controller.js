sap.ui.define([
  "./BaseController",
  "sap/m/MessageBox",
  "sap/ui/model/json/JSONModel"
], function (BaseController, MessageBox, JSONModel) {
  "use strict";

  return BaseController.extend("ui5.hft.portalappsample.controller.Main", {
    onInit: function() {
      var xmodel = new JSONModel();
      xmodel.setJSON(sessionStorage.xmodel)
      console.log(xmodel);
      this.getView().setModel(xmodel,"xmodel");
    },
    onHomePress: function() {
			window.open("../../#","_self");
    },
    sayHello: function() {
      var text="Hello World: "+sessionStorage.token;
      MessageBox.show(text);
      //MessageBox.show("Hello World!");
    }
  });

});
