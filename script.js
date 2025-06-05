const dataFolder = 'data';
let allItems = [];
let filteredItems = [];
let categories = new Set();

document.addEventListener('DOMContentLoaded', () => {
    setupViewToggle();
    setupSearchSortFilter();
    loadAllData().then(() => {
        populateCategoryFilter();
        applyFilters();
    });
});

function setupViewToggle() {
    const radios = document.querySelectorAll('input[name="view"]');
    radios.forEach(radio => {
        radio.addEventListener('change', () => {
            toggleView(radio.value);
        });
    });
}

function toggleView(view) {
    const tableView = document.getElementById('tableView');
    const cardView = document.getElementById('cardView');
    if (view === 'table') {
        tableView.style.display = '';
        cardView.style.display = 'none';
    } else {
        tableView.style.display = 'none';
        cardView.style.display = '';
    }
}

let currentSortColumn = null;
let currentSortDirection = null; // 'asc', 'desc', or null for default

function setupSearchSortFilter() {
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
    // Remove sortSelect listener since sorting will be done by clicking headers
    setupTableHeaderSorting();
}

function setupTableHeaderSorting() {
    const headers = document.querySelectorAll('#tableView th');
    headers.forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            const column = header.textContent.trim().toLowerCase();
            if (currentSortColumn === column) {
                // Cycle sort direction
                if (currentSortDirection === 'asc') {
                    currentSortDirection = 'desc';
                } else if (currentSortDirection === 'desc') {
                    currentSortDirection = null;
                    currentSortColumn = null;
                } else {
                    currentSortDirection = 'asc';
                }
            } else {
                currentSortColumn = column;
                currentSortDirection = 'asc';
            }
            applyFilters();
            updateSortIndicators();
        });
    });
}

function updateSortIndicators() {
    const headers = document.querySelectorAll('#tableView th');
    headers.forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
        const column = header.textContent.trim().toLowerCase();
        if (column === currentSortColumn) {
            if (currentSortDirection === 'asc') {
                header.classList.add('sort-asc');
            } else if (currentSortDirection === 'desc') {
                header.classList.add('sort-desc');
            }
        }
    });
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;

    filteredItems = allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    sortItems();
    renderItems();
}

function sortItems() {
    if (!currentSortColumn || !currentSortDirection) {
        // No sorting, keep original order
        filteredItems = filteredItems.slice();
        return;
    }

    filteredItems.sort((a, b) => {
        let aVal = a[currentSortColumn];
        let bVal = b[currentSortColumn];

        // Handle undefined or null values
        if (aVal === undefined || aVal === null) aVal = '';
        if (bVal === undefined || bVal === null) bVal = '';

        // Convert to string for name or other string fields
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return currentSortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentSortDirection === 'asc' ? 1 : -1;
        return 0;
    });
}

async function loadAllData() {
    allItems = [];
    categories = new Set();

    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            console.error('Failed to load data.json');
            return;
        }
        const data = await response.json();
        allItems = data;

        // Extract categories from data
        data.forEach(item => {
            if (item.category) {
                categories.add(item.category);
            }
        });
    } catch (error) {
        console.error('Error loading data.json', error);
    }
}

// Remove loadCategoryData function as it's no longer needed

function populateCategoryFilter() {
    const filter = document.getElementById('categoryFilter');
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = capitalize(category);
        filter.appendChild(option);
    });
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const sortOption = document.getElementById('sortSelect').value;

    filteredItems = allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    sortItems(sortOption);
    renderItems();
}

function sortItems(option) {
    switch (option) {
        case 'name-asc':
            filteredItems.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            filteredItems.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'cost-asc':
            filteredItems.sort((a, b) => (a.cost || 0) - (b.cost || 0));
            break;
        case 'cost-desc':
            filteredItems.sort((a, b) => (b.cost || 0) - (a.cost || 0));
            break;
    }
}

function renderItems() {
    renderTable(filteredItems);
    renderCards(filteredItems);
}

function renderTable(items) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    items.forEach(item => {
        if (!item.name) return; // Skip items without a name to avoid empty rows

        const tr = document.createElement('tr');
        tr.dataset.itemId = item.id || '';

        // Image
        const imageTd = document.createElement('td');
        if (item.image) {
            const img = document.createElement('img');
            if (item.image.startsWith('/media')) {
                img.src = '/DATA-FORTRESS' + item.image;
            } else {
                img.src = item.image;
            }
            img.alt = item.name;
            img.style.maxWidth = '60px';
            img.style.maxHeight = '40px';
            imageTd.appendChild(img);
        }
        tr.appendChild(imageTd);

        // Name with rarity color class based on avail
        const nameTd = document.createElement('td');
        nameTd.textContent = item.name || '';
        if (item.avail) {
            const avail = item.avail.toUpperCase();
            switch (avail) {
                case 'C':
                    nameTd.classList.add('rarity-c');
                    break;
                case 'P':
                    nameTd.classList.add('rarity-p');
                    break;
                case 'R':
                    nameTd.classList.add('rarity-r');
                    break;
                default:
                    // E or others: normal text color
                    break;
            }
        }
        tr.appendChild(nameTd);

        // WA with + prefix if non-negative
        const waTd = document.createElement('td');
        if (typeof item.wa === 'number') {
            waTd.textContent = (item.wa >= 0 ? '+' : '') + item.wa;
        } else {
            waTd.textContent = '';
        }
        tr.appendChild(waTd);

        // CON
        const conTd = document.createElement('td');
        conTd.textContent = item.con || '';
        tr.appendChild(conTd);

        // Remove Avail text display
        // const availTd = document.createElement('td');
        // availTd.textContent = item.avail || '';
        // tr.appendChild(availTd);

        // Damage
        const damageTd = document.createElement('td');
        damageTd.textContent = item.damage || '';
        tr.appendChild(damageTd);

        // Ammo
        const ammoTd = document.createElement('td');
        ammoTd.textContent = item.ammo || '';
        tr.appendChild(ammoTd);

        // Shots
        const shotsTd = document.createElement('td');
        shotsTd.textContent = item.shots !== undefined ? item.shots : '';
        tr.appendChild(shotsTd);

        // ROF
        const rofTd = document.createElement('td');
        rofTd.textContent = item.rof !== undefined ? item.rof : '';
        tr.appendChild(rofTd);

        // Rel
        const relTd = document.createElement('td');
        relTd.textContent = item.rel || '';
        tr.appendChild(relTd);

        // Range with "м" suffix
        const rangeTd = document.createElement('td');
        if (item.range !== undefined) {
            rangeTd.textContent = item.range + 'м';
        } else {
            rangeTd.textContent = '';
        }
        tr.appendChild(rangeTd);

        // Cost with "$" suffix
        const costTd = document.createElement('td');
        if (item.cost !== undefined) {
            costTd.textContent = item.cost + '$';
        } else {
            costTd.textContent = '';
        }
        tr.appendChild(costTd);

        tbody.appendChild(tr);
    });

    // Add click event listeners for row selection
    Array.from(tbody.children).forEach(tr => {
        tr.addEventListener('click', () => {
            selectItemById(tr.dataset.itemId);
        });
    });
}

function renderCards(items) {
    const container = document.getElementById('cardContainer');
    container.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.itemId = item.id || '';

        // Image
        if (item.image) {
            const img = document.createElement('img');
            if (item.image.startsWith('/media')) {
                img.src = '/DATA-FORTRESS' + item.image;
            } else {
                img.src = item.image;
            }
            img.alt = item.name;
            card.appendChild(img);
        }

        // Name with rarity color class based on avail
        const name = document.createElement('h3');
        name.textContent = item.name || '';
        if (item.avail) {
            const avail = item.avail.toUpperCase();
            switch (avail) {
                case 'C':
                    name.classList.add('rarity-c');
                    break;
                case 'P':
                    name.classList.add('rarity-p');
                    break;
                case 'R':
                    name.classList.add('rarity-r');
                    break;
                default:
                    // E or others: normal text color
                    break;
            }
        }
        card.appendChild(name);

        // WA with + prefix if non-negative
        if (typeof item.wa === 'number') {
            const wa = document.createElement('p');
            wa.textContent = 'WA: ' + (item.wa >= 0 ? '+' : '') + item.wa;
            card.appendChild(wa);
        }

        // CON
        if (item.con) {
            const con = document.createElement('p');
            con.textContent = 'CON: ' + item.con;
            card.appendChild(con);
        }

        // Remove Avail text display in cards
        // if (item.avail) {
        //     const avail = document.createElement('p');
        //     avail.textContent = 'Avail: ' + item.avail;
        //     card.appendChild(avail);
        // }

        // Damage
        if (item.damage) {
            const damage = document.createElement('p');
            damage.textContent = 'Damage: ' + item.damage;
            card.appendChild(damage);
        }

        // Ammo
        if (item.ammo) {
            const ammo = document.createElement('p');
            ammo.textContent = 'Ammo: ' + item.ammo;
            card.appendChild(ammo);
        }

        // Shots
        if (item.shots !== undefined) {
            const shots = document.createElement('p');
            shots.textContent = 'Shots: ' + item.shots;
            card.appendChild(shots);
        }

        // ROF
        if (item.rof !== undefined) {
            const rof = document.createElement('p');
            rof.textContent = 'ROF: ' + item.rof;
            card.appendChild(rof);
        }

        // Rel
        if (item.rel) {
            const rel = document.createElement('p');
            rel.textContent = 'Rel: ' + item.rel;
            card.appendChild(rel);
        }

        // Range with "м" suffix
        if (item.range !== undefined) {
            const range = document.createElement('p');
            range.textContent = 'Range: ' + item.range + 'м';
            card.appendChild(range);
        }

        // Cost with "$" suffix
        if (item.cost !== undefined) {
            const cost = document.createElement('p');
            cost.textContent = 'Cost: ' + item.cost + '$';
            card.appendChild(cost);
        }

        container.appendChild(card);
    });

    // Add click event listeners for card selection
    Array.from(container.children).forEach(card => {
        card.addEventListener('click', () => {
            selectItemById(card.dataset.itemId);
        });
    });
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Selected item display logic
let selectedItemId = null;

function selectItemById(id) {
    if (selectedItemId === id) return; // already selected
    selectedItemId = id;
    const item = allItems.find(i => i.id === id);
    renderSelectedItem(item);
}

function renderSelectedItem(item) {
    const container = document.getElementById('selectedItemDetails');
    container.innerHTML = '';
    if (!item) {
        container.innerHTML = '<p>Select an item to see details here.</p>';
        return;
    }

    // Image
    if (item.image) {
        const img = document.createElement('img');
        if (item.image.startsWith('/media')) {
            img.src = '/DATA-FORTRESS' + item.image;
        } else {
            img.src = item.image;
        }
        img.alt = item.name;
        container.appendChild(img);
    }

    // Name
    const name = document.createElement('h3');
    name.textContent = item.name || '';
    container.appendChild(name);

    // WA with + prefix if non-negative
    if (typeof item.wa === 'number') {
        const wa = document.createElement('p');
        wa.textContent = 'WA: ' + (item.wa >= 0 ? '+' : '') + item.wa;
        container.appendChild(wa);
    }

    // CON
    if (item.con) {
        const con = document.createElement('p');
        con.textContent = 'CON: ' + item.con;
        container.appendChild(con);
    }

    // Add Avail text display back in selected item details
    if (item.avail) {
        const avail = document.createElement('p');
        avail.textContent = 'Avail: ' + item.avail;
        container.appendChild(avail);
    }

    // Damage
    if (item.damage) {
        const damage = document.createElement('p');
        damage.textContent = 'Damage: ' + item.damage;
        container.appendChild(damage);
    }

    // Ammo
    if (item.ammo) {
        const ammo = document.createElement('p');
        ammo.textContent = 'Ammo: ' + item.ammo;
        container.appendChild(ammo);
    }

    // Shots
    if (item.shots !== undefined) {
        const shots = document.createElement('p');
        shots.textContent = 'Shots: ' + item.shots;
        container.appendChild(shots);
    }

    // ROF
    if (item.rof !== undefined) {
        const rof = document.createElement('p');
        rof.textContent = 'ROF: ' + item.rof;
        container.appendChild(rof);
    }

    // Rel
    if (item.rel) {
        const rel = document.createElement('p');
        rel.textContent = 'Rel: ' + item.rel;
        container.appendChild(rel);
    }

    // Range with "м" suffix
    if (item.range !== undefined) {
        const range = document.createElement('p');
        range.textContent = 'Range: ' + item.range + 'м';
        container.appendChild(range);
    }

    // Cost with "$" suffix
    if (item.cost !== undefined) {
        const cost = document.createElement('p');
        cost.textContent = 'Cost: ' + item.cost + '$';
        container.appendChild(cost);
    }
}
