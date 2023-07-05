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

/***/ "./src/js/mapaInicio.js":
/*!******************************!*\
  !*** ./src/js/mapaInicio.js ***!
  \******************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n(function () {\r\n  //Logical OR\r\n  const lat = 7.749776825746999;\r\n  // const lat = document.querySelector(\"#lat\").value || 7.749776825746999;\r\n  const lng = -72.22933727871077;\r\n  // const lng = document.querySelector(\"#lng\").value || -72.22933727871077;\r\n  const mapa = L.map(\"mapa-inicio\").setView([lat, lng], 16);\r\n\r\n  let markers = new L.FeatureGroup().addTo(mapa);\r\n  console.log(\"markers\", markers);\r\n  let propiedades = [];\r\n  //Filtros\r\n  const filtros = {\r\n    categoria: \"\",\r\n    precio: \"\",\r\n  };\r\n\r\n  const categoriasSelect = document.querySelector(\"#categorias\");\r\n  const preciosSelect = document.querySelector(\"#precios\");\r\n\r\n  L.tileLayer(\"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png\", {\r\n    attribution:\r\n      '&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors',\r\n  }).addTo(mapa);\r\n  //Filtrado de Categorías y Precios\r\n  // console.log(\"typeof e.target.value\", typeof e.target.value);\r\n  // console.log(\"e.target.value\", +e.target.value);\r\n  categoriasSelect.addEventListener(\"change\", (e) => {\r\n    filtros.categoria = +e.target.value;\r\n    filtrarPropiedades();\r\n  });\r\n  preciosSelect.addEventListener(\"change\", (e) => {\r\n    filtros.precio = +e.target.value;\r\n    filtrarPropiedades();\r\n  });\r\n\r\n  const obtenerPropiedades = async () => {\r\n    try {\r\n      const url = \"/api/propiedades\";\r\n      const respuesta = await fetch(url);\r\n      propiedades = await respuesta.json();\r\n      // console.log(\"propiedades\", propiedades);\r\n      mostrarPropiedades(propiedades);\r\n    } catch (error) {\r\n      console.log(\"error\", error);\r\n    }\r\n  };\r\n\r\n  const mostrarPropiedades = (propiedades) => {\r\n    //Limpiar los market previos\r\n    markers.clearLayers();\r\n\r\n    propiedades.forEach((propiedad) => {\r\n      // console.log(\"propiedad\", propiedad);\r\n      //Agregar los pines\r\n      const marker = new L.marker([propiedad?.lat, propiedad?.lng], {\r\n        autoPan: true,\r\n      }).addTo(mapa).bindPopup(`\r\n        <p class=\"text-purple-600 font-bold\">${propiedad.categoria.nombre}</p>\r\n          <h1 class=\"text-xl font-extrabold uppercase my-2\">${propiedad?.titulo}</h1>\r\n          <img class=\"rounded-lg\" src=\"/uploads/${propiedad?.imagen}\" alt=\"Imagen de la propiedad ${propiedad.titulo}\">\r\n          <p class=\"text-gray-600 font-bold\">${propiedad.precio.nombre}</p>\r\n          <a href=\"/propiedad/${propiedad.id}\" class=\"bg-purple-600 block p-2 text-center font-bold uppercase rounded-lg\">Ver propiedad</a>\r\n                   \r\n          `);\r\n      markers.addLayer(marker);\r\n    });\r\n  };\r\n\r\n  const filtrarPropiedades = () => {\r\n    // console.log(\"propiedades\", propiedades);\r\n    const resultado = propiedades\r\n      .filter(filtrarCategoria)\r\n      .filter(filtrarPrecio);\r\n    console.log(\"resultado\", resultado);\r\n    mostrarPropiedades(resultado);\r\n  };\r\n\r\n  const filtrarCategoria = (propiedad) =>\r\n    filtros.categoria ? propiedad.categoriaId === filtros.categoria : propiedad;\r\n\r\n  const filtrarPrecio = (propiedad) =>\r\n    filtros.precio ? propiedad.precioId === filtros.precio : propiedad;\r\n\r\n  // const filtrarPropiedades = () => {\r\n  //   const resultado = propiedades\r\n  //     .filter(filtrarCategoria)\r\n  //     .filter(filtrarPrecio);\r\n  //   mostrarPropiedades(resultado);\r\n  // };\r\n\r\n  // const filtrarCategoria = (propiedad) =>\r\n  //   filtros.categoria ? propiedad.categoriaId === filtros.categoria : propiedad;\r\n\r\n  // const filtrarPrecio = (propiedad) =>\r\n  //   filtros.precio ? propiedad.precioId === filtros.precio : propiedad;\r\n\r\n  obtenerPropiedades();\r\n})();\r\n\n\n//# sourceURL=webpack://ValleCaro_Inmobiliaria/./src/js/mapaInicio.js?");

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
/******/ 	__webpack_modules__["./src/js/mapaInicio.js"](0, __webpack_exports__, __webpack_require__);
/******/ 	
/******/ })()
;