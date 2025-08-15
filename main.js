import { Map, TileLayer } from 'leaflet';
import { getData } from './fetch-data.js';
import { HeatLayer } from './heatmap.js';

const loadingScreen = document.querySelector('#loading-screen');
const rangeInput = document.querySelector('.input-range input');
const exemptCheckbox = document.querySelector('#exempt-checkbox');

const mapObject = new Map('map').setView(
	[40.70860217889356, -73.89177289812899],
	11
);

const tiles = new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution:
		'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(mapObject);

/**
 * @param {boolean} state 
 */
const setLoading = (state) => {
	if (state) {
		loadingScreen.classList.remove("hide")
		rangeInput.setAttribute("disabled", true)
		exemptCheckbox.setAttribute("disabled", true)
	} else {
		loadingScreen.classList.add("hide")
		rangeInput.removeAttribute("disabled")
		exemptCheckbox.removeAttribute("disabled")
	}
}

let heatLayer;
let roundingAccuracy;
const updateMap = async (includeExempt, accuracy) => {
	setLoading(true);
	console.debug('Loading data');

	roundingAccuracy = roundingAccuracy || accuracy || 4;
	const {data, max} = await getData(includeExempt, roundingAccuracy);
	
	if (heatLayer) {
		mapObject.removeLayer(heatLayer);
	}
	console.debug('Data loaded, populating heatmap', {data, max});
	heatLayer = new HeatLayer(data, {
		max,
	});

	mapObject.addLayer(heatLayer);
	setLoading(false);
	console.debug('Heatmap populated');
};

// init map
updateMap();

// bind elements
if (rangeInput) {
	rangeInput.addEventListener('change', ({target: {value}}) => {
		updateMap(false, value);
	});
} else {
	console.warn('Range input not found');
}

if (exemptCheckbox) {
	exemptCheckbox.addEventListener('change', ({target: {checked}}) => {
		updateMap(checked);
	});
} else {
	console.warn('Exempt checkbox not found');
}
