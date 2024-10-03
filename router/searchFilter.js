// searchFilter.js

document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('searchForm');
    const accommodationCards = document.querySelectorAll('.accommodation-card');  // All the accommodation cards

    searchForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent form submission from reloading the page

        // Capture form data
        const formData = new FormData(searchForm);
        const searchParams = Object.fromEntries(formData.entries());

        // Loop through each card and determine whether it matches the criteria
        accommodationCards.forEach(card => {
            const name = card.dataset.name.toLowerCase();
            const city = card.dataset.city.toLowerCase();
            const price = parseFloat(card.dataset.price);
            const bedrooms = parseInt(card.dataset.bedrooms);

            let matches = true;

            // Check each criteria: name, city, price, bedrooms
            if (searchParams.name && !name.includes(searchParams.name.toLowerCase())) {
                matches = false;
            }

            if (searchParams.city && !city.includes(searchParams.city.toLowerCase())) {
                matches = false;
            }

            if (searchParams.minPrice && price < parseFloat(searchParams.minPrice)) {
                matches = false;
            }

            if (searchParams.maxPrice && price > parseFloat(searchParams.maxPrice)) {
                matches = false;
            }

            if (searchParams.bedrooms && bedrooms !== parseInt(searchParams.bedrooms)) {
                matches = false;
            }

            // Show or hide the card based on whether it matches
            if (matches) {
                card.style.display = 'block';  // Show the card
            } else {
                card.style.display = 'none';   // Hide the card
            }
        });
    });
});
