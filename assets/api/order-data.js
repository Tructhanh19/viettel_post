window.OrderData = (function () {
	'use strict';

	const API_BASE_URL = window.API_CONFIG.BASE_URL;
    const getAccessToken = window.API_CONFIG.getAccessToken;
	/**
	 * -----------------------------------------------------
	 * Tạo đơn hàng mới
	 * -----------------------------------------------------
	 */
	async function createOrder(data) {
		try {
			const url = `${API_BASE_URL}/orders/insert`;
			const token = getAccessToken && getAccessToken();
			const headers = { 'Content-Type': 'application/json' };
			if (token) headers['Authorization'] = `Bearer ${token}`;

			const response = await fetch(url, {
				method: 'POST',
				headers,
				body: JSON.stringify(data)
			});
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			return await response.json();
		} catch (err) {
			console.error('[OrderData] Lỗi khi tạo đơn hàng:', err);
			throw err;
		}
	}

	return {
		createOrder,
		// getOrderById, ...
	};
})();
