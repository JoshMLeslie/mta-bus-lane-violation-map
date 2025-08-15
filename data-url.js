const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
const dateString = (dateMs) => new Date(dateMs).toISOString().split('T')[0];

// lat / lng rounded to improve heatmap grouping. Original data has 14 decimals.
// 3: ~110 meters / 330 feet; 4: ~11m/33ft; 5: ~1m / 3.3ft
const ROUND_ACCURACY = 4;

const SoQLQuery = (includeExempt = false) => {
	const thirtyDaysAgo = dateString(Date.now() - thirtyDaysMs);

	return `
	SELECT
		ROUND(violation_latitude, ${ROUND_ACCURACY}) AS lat,
		ROUND(violation_longitude, ${ROUND_ACCURACY}) AS lng, 
		count(*) AS violation_count
	WHERE
		first_occurrence >= '${thirtyDaysAgo}'
		${includeExempt ? '' : `AND NOT starts_with(violation_status, "EXEMPT")`}
	GROUP BY 
		ROUND(violation_latitude, ${ROUND_ACCURACY}),
		ROUND(violation_longitude, ${ROUND_ACCURACY})
	`;
};

/**
 *
 * @param {boolean} includeExempt
 * @returns {{lat: string; lng: string; violation_count: string}}
 */
const url = (includeExempt = false) =>
	`https://data.ny.gov/resource/kh8p-hcbm.json?$query=${encodeURIComponent(
		SoQLQuery(includeExempt)
	)}`;

// calculate max since the SoQL MTA engine doesn't want to
const getMaxCount = (violation_data) => {
	let max = 0;
	violation_data.forEach(({violation_count}) => {
		if (violation_count === undefined) {
			return;
		}
		const useVC = +violation_count;
		if (useVC > max) {
			max = useVC;
		}
	});

	return max;
};

const mapToHeatMap = (violation_data) => {
	return violation_data.map((d) => {
		return [Number(d.lat), Number(d.lng), Number(d.violation_count)];
	});
};

export const getData = async (includeExempt = false) => {
	try {
		const res = await fetch(url(includeExempt));
		if (!res.ok) {
			throw new Error(`HTTP ${res.status}`);
		}
		const violation_data = await res.json();

		return {
			data: mapToHeatMap(violation_data),
			max: getMaxCount(violation_data),
		};
	} catch (e) {
		console.error(e);
		throw e;
	}
};
