import { Map, TileLayer } from 'leaflet';
import { getData } from './fetch-data.js';
import { HeatLayer } from './heatmap.js';

const map = new Map('map').setView([40.70860217889356, -73.89177289812899], 11);

const tiles = new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution:
		'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

let heatLayer;
let roundingAccuracy;
const updateMap = async (includeExempt, accuracy) => {
	roundingAccuracy = roundingAccuracy || accuracy || 4;
	console.debug('Loading data');
	const {data, max} = await getData(includeExempt, roundingAccuracy);
	console.debug('Data loaded, populating heatmap', {data, max});
	if (heatLayer) {
		map.removeLayer(heatLayer);
	}
	heatLayer = new HeatLayer(data, {
		max,
	});
	map.addLayer(heatLayer);
	console.debug('Heatmap populated');
};

// init map
updateMap();

// bind elements
const rangeInput = document.querySelector('.input-range');
if (rangeInput) {
	rangeInput.addEventListener('change', ({target: {value}}) => {
		updateMap(false, value);
	});
} else {
	console.warn('Range input not found');
}

const exemptCheckbox = document.querySelector('#exempt-checkbox');
if (exemptCheckbox) {
	exemptCheckbox.addEventListener('change', ({target: {checked}}) => {
		updateMap(checked);
	});
} else {
	console.warn('Exempt checkbox not found');
}
