document.addEventListener("DOMContentLoaded", () => {

    // ======================================
    // GET SEARCH INPUTS
    // ======================================

    const fromInput = document.getElementById("fromCity");
    const toInput = document.getElementById("toCity");

    const fromBox = document.getElementById("fromSuggestions");
    const toBox = document.getElementById("toSuggestions");

    // Stop if this page doesn't contain the search form.
    if (!fromInput || !toInput || !fromBox || !toBox) {
        return;
    }

    const STORAGE_KEY = "funnrideRecentSearches";

    // ======================================
    // FETCH LOCATIONS FROM MONGODB API
    // ======================================

    async function fetchLocations(query) {

        try {
            const response = await fetch(
                `/api/locations?q=${encodeURIComponent(query)}`
            );

            if (!response.ok) {
                throw new Error("Unable to fetch locations");
            }

            return await response.json();

        } catch (error) {
            console.error("Location Fetch Error:", error);
            return [];
        }
    }

    // ======================================
    // GET RECENT SEARCHES
    // ======================================

    function getRecentSearches() {

        try {
            const searches = JSON.parse(
                localStorage.getItem(STORAGE_KEY) || "[]"
            );

            return Array.isArray(searches) ? searches : [];

        } catch (error) {
            return [];
        }
    }

    // ======================================
    // SAVE RECENT SEARCHES
    // ======================================

    function saveRecentSearch(from, to) {

        from = from.trim();
        to = to.trim();

        if (!from || !to) {
            return;
        }

        const searches = getRecentSearches();

        const newSearch = {
            from,
            to
        };

        // Remove duplicate searches.
        const filteredSearches = searches.filter(search =>
            search.from.toLowerCase() !== from.toLowerCase() ||
            search.to.toLowerCase() !== to.toLowerCase()
        );

        // Keep the five most recent searches.
        const updatedSearches = [
            newSearch,
            ...filteredSearches
        ].slice(0, 5);

        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(updatedSearches)
            );
        } catch (error) {
            console.error("Unable to save recent searches", error);
        }
    }

    // ======================================
    // CREATE SUGGESTION BUTTON
    // ======================================

    function addSuggestion(box, text, callback) {

        const button = document.createElement("button");

        button.type = "button";

        button.className =
            "list-group-item list-group-item-action";

        button.textContent = text;

        button.addEventListener("click", callback);

        box.appendChild(button);
    }

    // ======================================
    // SHOW RECENT SEARCHES
    // ======================================

    function showRecentSearches(box) {

        const searches = getRecentSearches();

        if (searches.length === 0) {
            return;
        }

        const heading = document.createElement("div");

        heading.className =
            "list-group-item small text-muted";

        heading.textContent = "Recent searches";

        box.appendChild(heading);

        searches.forEach(search => {

            addSuggestion(
                box,
                `🕘 ${search.from} → ${search.to}`,
                () => {

                    fromInput.value = search.from;
                    toInput.value = search.to;

                    fromBox.style.display = "none";
                    toBox.style.display = "none";
                }
            );
        });
    }

    // ======================================
    // SHOW LOCATION SUGGESTIONS
    // ======================================

    async function showSuggestions(input, box) {

        const query = input.value.trim();

        // Empty the previous suggestions.
        box.replaceChildren();

        // Show recent searches when the input is empty.
        if (!query) {

            showRecentSearches(box);

            // Retrieve available locations from the database.
            const locations = await fetchLocations("");

            // Ignore outdated API responses.
            if (input.value.trim() !== query) {
                return;
            }

            if (locations.length > 0) {

                const heading = document.createElement("div");

                heading.className =
                    "list-group-item small text-muted";

                heading.textContent = "Available locations";

                box.appendChild(heading);

                locations.slice(0, 5).forEach(location => {

                    addSuggestion(box, location, () => {

                        input.value = location;

                        box.style.display = "none";
                    });

                });
            }

        } else {

            // Fetch matching locations from MongoDB.
            const locations = await fetchLocations(query);

            // Don't show results for an outdated query.
            if (input.value.trim() !== query) {
                return;
            }

            if (locations.length === 0) {

                const message = document.createElement("div");

                message.className =
                    "list-group-item text-muted";

                message.textContent = "No matching locations found";

                box.appendChild(message);

            } else {

                locations.forEach(location => {

                    addSuggestion(box, location, () => {

                        input.value = location;

                        box.style.display = "none";
                    });

                });
            }
        }

        box.style.display =
            box.children.length > 0 ? "block" : "none";
    }

    // ======================================
    // FROM INPUT EVENTS
    // ======================================

    fromInput.addEventListener("input", () => {
        showSuggestions(fromInput, fromBox);
    });

    fromInput.addEventListener("focus", () => {
        showSuggestions(fromInput, fromBox);
    });

    // ======================================
    // TO INPUT EVENTS
    // ======================================

    toInput.addEventListener("input", () => {
        showSuggestions(toInput, toBox);
    });

    toInput.addEventListener("focus", () => {
        showSuggestions(toInput, toBox);
    });

    // ======================================
    // CLOSE SUGGESTIONS WHEN CLICKING OUTSIDE
    // ======================================

    document.addEventListener("click", event => {

        if (
            !fromInput.parentElement.contains(event.target)
        ) {
            fromBox.style.display = "none";
        }

        if (
            !toInput.parentElement.contains(event.target)
        ) {
            toBox.style.display = "none";
        }
    });

    // ======================================
    // SAVE SEARCH WHEN FORM IS SUBMITTED
    // ======================================

    const form = fromInput.closest("form");

    if (form) {

        form.addEventListener("submit", () => {

            saveRecentSearch(
                fromInput.value,
                toInput.value
            );
        });
    }

});