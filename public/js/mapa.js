/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/js/mapa.js":
/*!************************!*\
  !*** ./src/js/mapa.js ***!
  \************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n(function () {\r\n  //Logical OR\r\n  // const lat = 7.749776825746999;\r\n  const lat = document.querySelector(\"#lat\").value || 7.749776825746999;\r\n  // const lng = -72.22933727871077;\r\n  const lng = document.querySelector(\"#lng\").value || -72.22933727871077;\r\n\r\n  const mapa = L.map(\"mapa\").setView([lat, lng], 16);\r\n  let marker;\r\n  // Utilizar Provider y Geocoder\r\n  const geocodeService = L.esri.Geocoding.geocodeService();\r\n\r\n  L.tileLayer(\"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png\", {\r\n    attribution:\r\n      '&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors',\r\n  }).addTo(mapa);\r\n  // El pin\r\n  marker = new L.marker([lat, lng], {\r\n    draggable: true,\r\n    autoPan: true,\r\n  }).addTo(mapa);\r\n  // Detectar el movimiento del pin\r\n  marker.on(\"moveend\", function (e) {\r\n    marker = e.target;\r\n    // console.log(\"marker\", marker);\r\n    const posicion = marker.getLatLng();\r\n    console.log(\"posicion\", posicion);\r\n    mapa.panTo(new L.LatLng(posicion.lat, posicion.lng));\r\n    // Obtener la información de las calles al soltar el pin\r\n    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${posicion.lat}&lon=${posicion.lng}`;\r\n\r\n    fetch(nominatimUrl)\r\n      .then((response) => response.json())\r\n      .then((nominatimData) => {\r\n        const direccionNominatim =\r\n          nominatimData?.display_name || \"Dirección no disponible\";\r\n        const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${posicion.lat},${posicion.lng}`;\r\n        const popupContent = `\r\n          <strong>Dirección obtenida:</strong> <a href=\"${googleMapsLink}\" target=\"_blank\" rel=\"noopener noreferrer\">${direccionNominatim}</a><br>\r\n          <span style=\"font-size: 12px;\">Haz click para ver el mapa en Google Maps</span>\r\n        `;\r\n        marker.bindPopup(popupContent).openPopup();\r\n        console.log(\"direccionNominatim\", direccionNominatim);\r\n        //LLenar los campos\r\n        document.querySelector(\".calle\").textContent = direccionNominatim ?? \"\";\r\n        document.querySelector(\"#calle\").value = direccionNominatim ?? \"\";\r\n        document.querySelector(\"#lat\").value = posicion.lat ?? \"\";\r\n        document.querySelector(\"#lng\").value = posicion.lng ?? \"\";\r\n      })\r\n      .catch((error) => {\r\n        console.error(\"Error:\", error);\r\n        const popupContent = `Error al obtener la dirección`;\r\n        marker.bindPopup(popupContent).openPopup();\r\n      });\r\n  });\r\n})();\r\n\n\n//# sourceURL=webpack://ValleCaro_Inmobiliaria/./src/js/mapa.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/js/mapa.js"](0, __webpack_exports__, __webpack_require__);
/******/ 	
/******/ })()
;