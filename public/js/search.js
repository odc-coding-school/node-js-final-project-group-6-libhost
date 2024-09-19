
document.getElementById('searchForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission

    const location = document.getElementById('location').value;
    const priceMin = document.getElementById('priceMin').value;
    const priceMax = document.getElementById('priceMax').value;
    const amenities = document.getElementById('amenities').value;

    // Build the query URL
    let queryURL = `/search?`;
    if (location) queryURL += `location=${encodeURIComponent(location)}&`;
    if (priceMin) queryURL += `priceMin=${encodeURIComponent(priceMin)}&`;
    if (priceMax) queryURL += `priceMax=${encodeURIComponent(priceMax)}&`;
    if (amenities) queryURL += `amenities=${encodeURIComponent(amenities)}`;

    // Fetch API to send the request to the server
    fetch(queryURL)
        .then(response => response.json())
        .then(data => {
            console.log('Search results:', data); // Here you should update your HTML based on the data
            updateAccommodationsDisplay(data);
        })
        .catch(error => console.error('Error fetching data:', error));
});

// Function to update the HTML display of accommodations
function updateAccommodationsDisplay(accommodations) {
    const container = document.getElementById('content-section');
    container.innerHTML = ''; // Clear existing content

    accommodations.forEach(acc => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="desc fixed shadow">
                <ul class="list-unstyle text-left">
                    <li><p class="text-capitalize text-bold text-left">
                        <i class="fa fa-map-marker"></i> ${acc.name} || ${acc.location}
                    </p></li>
                    <li><p class="text-capitalize text-bold text-left">
                        <i class="fa fa-dollar"></i>${acc.price} per night
                    </p></li>
                    <li><p class="text-capitalize text-bold text-left">
                        <i class="fa fa-bed"></i> ${acc.bedrooms} bedrooms
                    </p></li>
                </ul>
            </div>
        `;
        container.appendChild(card);
    });
}
