document.addEventListener('DOMContentLoaded', async function () {
  // Sélection des éléments du DOM
  const brandSelect = document.getElementById('brand');
  const modelSelect = document.getElementById('model');
  const gearboxSelect = document.getElementById('gearbox');
  const priceInput = document.getElementById('price');
  const filterButton = document.getElementById('filter-btn');
  const annoncesDiv = document.getElementById('annonces');
  const burgerMenu = document.getElementById('burger-menu');
  const navMenu = document.getElementById('nav-menu');

  // Gérer le clic sur le bouton burger pour afficher/masquer le menu
  if (burgerMenu) {
    burgerMenu.addEventListener('click', function () {
      navMenu.classList.toggle('show');
    });
  }

  // Informations d'accès Airtable
  const apiKey = 'patvWkfPXlYuM1jjN.cfb1c14a851bf57bd07ab645882e6362d9a88c833608abe53faffd1ddd6f1e44';
  const apiUrlAnnonces = `https://api.airtable.com/v0/apprRBKlK2tlPjFa4/Annonces`;
  const apiUrlMarques = `https://api.airtable.com/v0/apprRBKlK2tlPjFa4/Marques`;
  const apiUrlModeles = `https://api.airtable.com/v0/apprRBKlK2tlPjFa4/Modèles`;

  // Stockage des annonces, marques, et modèles
  let annonces = [];
  let marquesDict = {};  // Pour mapper les IDs des marques aux noms
  let modelesDict = {};  // Pour mapper les IDs des modèles aux noms

  // Fonction pour récupérer les données depuis Airtable
  async function fetchData(url) {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data.records;

    } catch (error) {
      console.error('Erreur lors du chargement des données depuis Airtable :', error);
      return [];
    }
  }

  // Charger les marques et les stocker dans un dictionnaire
  async function fetchMarques() {
    const records = await fetchData(apiUrlMarques);
    records.forEach(record => {
      marquesDict[record.id] = record.fields['Nom de la Marque'];
    });
    console.log('Dictionnaire des marques :', marquesDict);
  }

  // Charger les modèles et les stocker dans un dictionnaire
  async function fetchModeles() {
    const records = await fetchData(apiUrlModeles);
    records.forEach(record => {
      modelesDict[record.id] = record.fields['Nom du Modèle'];
    });
    console.log('Dictionnaire des modèles :', modelesDict);
  }

  // Charger les annonces depuis Airtable et remplacer les IDs par les noms
  async function fetchAnnonces() {
    const records = await fetchData(apiUrlAnnonces);
    annonces = records.map(record => {
      // Récupérer les noms réels des marques et modèles à partir des dictionnaires
      let marque = Array.isArray(record.fields['Marque']) ? marquesDict[record.fields['Marque'][0]] : '';
      let modele = Array.isArray(record.fields['Modèle']) ? modelesDict[record.fields['Modèle'][0]] : '';

      return {
        id: record.id,
        titre: record.fields['Titre'] || 'Titre non disponible',
        marque: marque,
        modele: modele,
        annee: record.fields['Année'],
        boite: record.fields['Boîte'] || "",
        prix: record.fields['Prix'],
        image: record.fields['Image'] ? record.fields['Image'][0].url : 'images/placeholder.jpg'
      };
    });

    // Extraire les marques et modèles disponibles
    const availableBrands = [...new Set(annonces.map(annonce => annonce.marque))].filter(Boolean).sort();
    const availableModels = [...new Set(annonces.map(annonce => annonce.modele))].filter(Boolean).sort();

    // Remplir les listes déroulantes de marques et modèles
    populateBrandFilter(availableBrands);
    populateModelFilter(availableModels);

    // Afficher les annonces initialement
    displayAnnonces(annonces);
  }

  // Fonction pour remplir le filtre des marques
  function populateBrandFilter(brands) {
    brandSelect.innerHTML = '<option value="">Marque</option>';
    brands.forEach(brand => {
      const option = document.createElement('option');
      option.value = brand;
      option.textContent = brand;
      brandSelect.appendChild(option);
    });

    // Charger les modèles lorsque la marque est sélectionnée
    brandSelect.addEventListener('change', () => {
      const selectedBrand = brandSelect.value;
      updateModelFilter(selectedBrand);
    });
  }

  // Fonction pour mettre à jour le filtre des modèles en fonction de la marque sélectionnée
  function updateModelFilter(selectedBrand) {
    if (selectedBrand) {
      const filteredModels = annonces
        .filter(annonce => annonce.marque === selectedBrand)
        .map(annonce => annonce.modele);
      const uniqueModels = [...new Set(filteredModels)].sort();

      populateModelFilter(uniqueModels);
      modelSelect.disabled = uniqueModels.length === 0;
    } else {
      populateModelFilter([]);
      modelSelect.disabled = true;
    }
  }

  // Fonction pour remplir le filtre des modèles
  function populateModelFilter(models) {
    modelSelect.innerHTML = '<option value="">Modèle</option>';
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      modelSelect.appendChild(option);
    });
  }

  // Appliquer les filtres aux annonces déjà récupérées
  filterButton.addEventListener('click', function (event) {
    event.preventDefault();
    applyFilters();
  });

  // Fonction pour appliquer les filtres localement
  function applyFilters() {
    const selectedBrand = brandSelect.value.trim();
    const selectedModel = modelSelect.value.trim();
    const selectedGearbox = gearboxSelect.value.trim();
    const maxPrice = parseFloat(priceInput.value);

    console.log('Filtres sélectionnés :', {
      selectedBrand,
      selectedModel,
      selectedGearbox,
      maxPrice
    });

    // Filtrer les annonces en fonction des critères sélectionnés
    const filteredAnnonces = annonces.filter(annonce => {
      const matchesBrand = selectedBrand ? annonce.marque === selectedBrand : true;
      const matchesModel = selectedModel ? annonce.modele === selectedModel : true;
      const matchesGearbox = selectedGearbox ? annonce.boite.toLowerCase() === selectedGearbox.toLowerCase() : true;
      const matchesPrice = !isNaN(maxPrice) ? annonce.prix <= maxPrice : true;

      return matchesBrand && matchesModel && matchesGearbox && matchesPrice;
    });

    console.log('Annonces filtrées :', filteredAnnonces);
    displayAnnonces(filteredAnnonces);
  }

  // Fonction pour afficher les annonces
  function displayAnnonces(data) {
    annoncesDiv.innerHTML = '';
    if (data.length > 0) {
      data.forEach(annonce => {
        const card = document.createElement('div');
        card.className = 'car-card';
        card.innerHTML = `
          <img src="${annonce.image}" alt="${annonce.modele}" onerror="this.src='images/placeholder.jpg';" />
          <h3>${annonce.titre}</h3>
          <p>Année : ${annonce.annee}</p>
          <p>Boîte : ${annonce.boite}</p>
          <p>Prix : ${typeof annonce.prix === 'number' ? annonce.prix.toLocaleString() : 'Prix non disponible'} €</p>
        `;
        annoncesDiv.appendChild(card);
      });
    } else {
      annoncesDiv.innerHTML = '<p>Aucune annonce ne correspond à vos critères.</p>';
    }
  }

  // Charger les données au démarrage
  await fetchMarques();
  await fetchModeles();
  await fetchAnnonces();
});
