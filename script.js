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

function setupSearchSortFilter() {
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
    document.getElementById('sortSelect').addEventListener('change', applyFilters);
}

async function loadAllData() {
    allItems = [];
    categories = new Set();

    // List of categories based on folder names inside data folder
    const categoryFolders = ['ammunition', 'armor', 'cyberware', 'vehicles', 'weapons'];

    for (const category of categoryFolders) {
        const items = await loadCategoryData(category);
        items.forEach(item => {
            item.category = category;
            allItems.push(item);
            categories.add(category);
        });
    }
}

async function loadCategoryData(category) {
    const items = [];
    try {
        // Fetch the index file for the category
        const indexResponse = await fetch(dataFolder + '/' + category + '/index.json');
        if (!indexResponse.ok) {
console.warn('Index file not found for category: ' + category);
            return items;
        }
        const fileList = await indexResponse.json();
        for (const file of fileList) {
            const response = await fetch(dataFolder + '/' + category + '/' + file);
            if (response.ok) {
                const data = await response.json();
                items.push(data);
            }
        }
    } catch (error) {
        console.error('Error loading data for category', category, error);
    }
    return items;
}

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
        const tr = document.createElement('tr');

        const nameTd = document.createElement('td');
        nameTd.textContent = item.name || '';
        tr.appendChild(nameTd);

        const categoryTd = document.createElement('td');
        categoryTd.textContent = capitalize(item.category || '');
        tr.appendChild(categoryTd);

        const damageTd = document.createElement('td');
        damageTd.textContent = item.damage || '';
        tr.appendChild(damageTd);

        const costTd = document.createElement('td');
        costTd.textContent = item.cost !== undefined ? item.cost : '';
        tr.appendChild(costTd);

        const rangeTd = document.createElement('td');
        rangeTd.textContent = item.range !== undefined ? item.range : '';
        tr.appendChild(rangeTd);

        const imageTd = document.createElement('td');
        if (item.image) {
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.name;
            img.style.maxWidth = '60px';
            img.style.maxHeight = '40px';
            imageTd.appendChild(img);
        }
        tr.appendChild(imageTd);

        tbody.appendChild(tr);
    });
}

function renderCards(items) {
    const container = document.getElementById('cardContainer');
    container.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';

        if (item.image) {
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.name;
            card.appendChild(img);
        }

        const name = document.createElement('h3');
        name.textContent = item.name || '';
        card.appendChild(name);

        const category = document.createElement('p');
        category.textContent = 'Category: ' + capitalize(item.category || '');
        card.appendChild(category);

        if (item.damage) {
            const damage = document.createElement('p');
            damage.textContent = 'Damage: ' + item.damage;
            card.appendChild(damage);
        }

        if (item.cost !== undefined) {
            const cost = document.createElement('p');
            cost.textContent = 'Cost: ' + item.cost;
            card.appendChild(cost);
        }

        if (item.range !== undefined) {
            const range = document.createElement('p');
            range.textContent = 'Range: ' + item.range;
            card.appendChild(range);
        }

        container.appendChild(card);
    });
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
