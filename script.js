console.log('============================');


// Etiket sistemi fonksiyonları
function loadPlaceTags() {
    const saved = localStorage.getItem('place-tags');
    placeTags = saved ? JSON.parse(saved) : {};
    console.log('Mekan etiketleri yüklendi:', Object.keys(placeTags).length, 'mekan');
}

function savePlaceTagsToStorage() {
    localStorage.setItem('place-tags', JSON.stringify(placeTags));
    console.log('Mekan etiketleri kaydedildi');
}

// Otomatik etiketler oluştur
function generateAutoTags() {
    allPlaces.forEach(place => {
        if (!placeTags[place.id]) {
            placeTags[place.id] = [];
        }
        
        const autoTags = getAutoTags(place);
        
        // Mevcut etiketlere otomatik etiketleri ekle (duplicate kontrolü ile)
        autoTags.forEach(tag => {
            if (!placeTags[place.id].includes(tag)) {
                placeTags[place.id].push(tag);
            }
        });
    });
    
    savePlaceTagsToStorage();
    console.log('🏷️ Otomatik etiketler oluşturuldu');
}

// Mekan için otomatik etiket önerileri
function getAutoTags(place) {
    const tags = [];
    const name = place.name.toLowerCase();
    const type = place.type;
    
    // Mekan tipine göre otomatik etiketler
    switch(type) {
        case 'restaurant':
            tags.push('yemek');
            break;
        case 'cafe':
            tags.push('kahve-guzel');
            break;
        case 'fast_food':
            tags.push('hizli-servis');
            break;
        case 'bar':
        case 'pub':
            tags.push('gece-hayati');
            break;
    }
    
    // İsme göre otomatik etiketler
    if (name.includes('mcdonald') || name.includes('burger king') || name.includes('kfc')) {
        tags.push('fast-food', 'ucuz');
    }
    if (name.includes('starbucks') || name.includes('kahve')) {
        tags.push('kahve-guzel', 'wifi-hizli');
    }
    if (name.includes('pizza')) {
        tags.push('pizza', 'aile-dostu');
    }
    if (name.includes('döner') || name.includes('doner')) {
        tags.push('türk-mutfağı', 'ucuz');
    }
    
    // OpenStreetMap verilerine göre etiketler
    if (place.wifi === 'yes') tags.push('wifi-hizli');
    if (place.wifi === 'no') tags.push('wifi-yok');
    if (place.wheelchair === 'yes') tags.push('erisilebilir');
    if (place.takeaway === 'yes') tags.push('paket-servis');
    if (place.delivery === 'yes') tags.push('delivery');
    if (place.outdoor_seating === 'yes') tags.push('acik-alan');
    if (place.smoking === 'no') tags.push('sigara-icilmez');
    if (place.payment_cards === 'yes') tags.push('kart-kabul');
    
    return tags;
}

// Mekanın etiketlerini al
function getPlaceTags(place) {
    return placeTags[place.id] || [];
}

// Etiket modalını aç
let currentTagsPlace = null;
window.openTagsModal = function(placeId) {
    console.log('🏷️ Etiket modal açılıyor, placeId:', placeId);
    
    const place = allPlaces.find(p => p.id === placeId);
    if (!place) {
        console.error('❌ Mekan bulunamadı:', placeId);
        return;
    }
    
    currentTagsPlace = place;
    const modal = document.getElementById('tagsModal');
    
    if (!modal) {
        console.error('❌ Tags modal element bulunamadı!');
        return;
    }
    
    const tagsPlaceName = document.getElementById('tagsPlaceName');
    const tagsPlaceAddress = document.getElementById('tagsPlaceAddress');
    
    tagsPlaceName.textContent = place.name;
    tagsPlaceAddress.textContent = place.address;
    
    // Mevcut etiketleri göster
    updateCurrentTagsList();
    
    // Önerilen etiketleri işaretle
    updateSuggestedTags();
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Etiket modal açıldı');
};

// Etiket modalını kapat
window.closeTagsModal = function() {
    const modal = document.getElementById('tagsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        currentTagsPlace = null;
        console.log('✅ Etiket modal kapandı');
    }
};

// Mevcut etiketler listesini güncelle
function updateCurrentTagsList() {
    if (!currentTagsPlace) return;
    
    const currentTagsList = document.getElementById('currentTagsList');
    const tags = placeTags[currentTagsPlace.id] || [];
    
    if (tags.length === 0) {
        currentTagsList.innerHTML = '<div style="color: #6c757d; font-style: italic;">Henüz etiket eklenmemiş</div>';
        return;
    }
    
    currentTagsList.innerHTML = tags.map(tag => `
        <div class="current-tag">
            ${tag}
            <button class="remove-tag" onclick="removeTag('${tag}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// Önerilen etiketleri güncelle
function updateSuggestedTags() {
    if (!currentTagsPlace) return;
    
    const currentTags = placeTags[currentTagsPlace.id] || [];
    const tagOptions = document.querySelectorAll('.tag-option');
    
    tagOptions.forEach(button => {
        const tag = button.getAttribute('data-tag');
        if (currentTags.includes(tag)) {
            button.classList.add('selected');
        } else {
            button.classList.remove('selected');
        }
        
        // Click event ekle
        button.onclick = function() {
            toggleTag(tag);
        };
    });
}

// Etiketi ekle/çıkar
function toggleTag(tag) {
    if (!currentTagsPlace) return;
    
    if (!placeTags[currentTagsPlace.id]) {
        placeTags[currentTagsPlace.id] = [];
    }
    
    const tags = placeTags[currentTagsPlace.id];
    const index = tags.indexOf(tag);
    
    if (index === -1) {
        // Etiket ekle
        tags.push(tag);
        console.log('✅ Etiket eklendi:', tag);
    } else {
        // Etiket çıkar
        tags.splice(index, 1);
        console.log('❌ Etiket çıkarıldı:', tag);
    }
    
    // UI'yi güncelle
    updateCurrentTagsList();
    updateSuggestedTags();
}

// Etiketi sil
window.removeTag = function(tag) {
    if (!currentTagsPlace) return;
    
    const tags = placeTags[currentTagsPlace.id];
    const index = tags.indexOf(tag);
    
    if (index !== -1) {
        tags.splice(index, 1);
        updateCurrentTagsList();
        updateSuggestedTags();
        console.log('❌ Etiket silindi:', tag);
    }
};

// Özel etiket ekle
window.addCustomTag = function() {
    const input = document.getElementById('customTagInput');
    const customTag = input.value.trim().toLowerCase();
    
    if (!customTag) {
        showNotification('Lütfen bir etiket yazın!', 'error');
        return;
    }
    
    if (customTag.length > 20) {
        showNotification('Etiket çok uzun! Maksimum 20 karakter.', 'error');
        return;
    }
    
    if (!currentTagsPlace) return;
    
    if (!placeTags[currentTagsPlace.id]) {
        placeTags[currentTagsPlace.id] = [];
    }
    
    const tags = placeTags[currentTagsPlace.id];
    
    if (tags.includes(customTag)) {
        showNotification('Bu etiket zaten ekli!', 'error');
        return;
    }
    
    tags.push(customTag);
    input.value = '';
    
    updateCurrentTagsList();
    showNotification('Özel etiket eklendi!', 'success');
    console.log('✅ Özel etiket eklendi:', customTag);
};

// Mekan etiketlerini kaydet
window.savePlaceTags = function() {
    if (!currentTagsPlace) return;
    
    savePlaceTagsToStorage();
    showNotification('Etiketler kaydedildi!', 'success');
    console.log('✅ Etiketler kaydedildi:', currentTagsPlace.name);
    
    closeTagsModal();
    
    // Ana listeyi güncelle
    applyFilters();
};// Global değişkenler
let map;
let userMarker;
let currentPosition = null;
let placesMarkers = [];
let allPlaces = []; // Tüm mekan verilerini sakla
let filteredPlaces = []; // Filtrelenmiş mekan verileri
let favorites = []; // Favori mekanlar
let unsplashApiKey = ''; // Unsplash API key
let photoCache = new Map(); // Fotoğraf önbelleği
let searchHistory = []; // Arama geçmişi
let visitedPlaces = new Set(); // Ziyaret edilen mekanlar
let userNotes = {}; // Kullanıcı notları { placeId: { note: "text", date: "ISO string" } }
let placeTags = {}; // Mekan etiketleri { placeId: ["tag1", "tag2"] }

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    setupEventListeners();
    loadFavorites(); // Favorileri yükle
    loadApiSettings(); // API ayarlarını yükle
    loadSearchHistory(); // Arama geçmişini yükle
    loadUserNotes(); // Kullanıcı notlarını yükle
    loadPlaceTags(); // Mekan etiketlerini yükle
    
    // Textarea event listener'ı ekle
    setTimeout(() => {
        const textarea = document.getElementById('noteTextarea');
        if (textarea) {
            textarea.addEventListener('input', updateCharCounter);
            console.log('✅ Textarea event listener eklendi');
        }
    }, 100);
});

// Haritayı başlat
function initializeMap() {
    // Varsayılan olarak İstanbul'u göster
    map = L.map('map').setView([41.0082, 28.9784], 10);
    
    // OpenStreetMap tile layer ekle
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    console.log('Harita başarıyla yüklendi');
}

// Event listeners kurulumu
function setupEventListeners() {
    const findLocationBtn = document.getElementById('findLocationBtn');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const toggleApiSettings = document.getElementById('toggleApiSettings');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const showStatsBtn = document.getElementById('showStatsBtn');
    
    findLocationBtn.addEventListener('click', findUserLocation);
    applyFiltersBtn.addEventListener('click', applyFilters);
    toggleApiSettings.addEventListener('click', toggleApiSettingsPanel);
    saveApiKeyBtn.addEventListener('click', saveApiSettings);
    showStatsBtn.addEventListener('click', showStatsModal);
    
    // Filter değişikliklerini dinle
    document.getElementById('typeFilter').addEventListener('change', applyFilters);
    document.getElementById('distanceFilter').addEventListener('change', applyFilters);
    document.getElementById('sortFilter').addEventListener('change', applyFilters);
}

// Kullanıcının konumunu bul
function findUserLocation() {
    const statusDiv = document.getElementById('locationStatus');
    const btn = document.getElementById('findLocationBtn');
    
    // Buton durumunu güncelle
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Konum Bulunuyor...';
    
    // Durum mesajını güncelle
    updateStatus('Konumunuz bulunuyor...', 'info');
    
    // Geolocation API'sini kontrol et
    if (!navigator.geolocation) {
        updateStatus('Tarayıcınız konum hizmetlerini desteklemiyor.', 'error');
        resetButton();
        return;
    }
    
    // HTTPS kontrolü
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        updateStatus('Konum servisi HTTPS bağlantısı gerektirir.', 'error');
        resetButton();
        
        // Alternatif olarak manuel konum girişi öner
        setTimeout(() => {
            if (confirm('Konum otomatik bulunamadı. İstanbul merkezinden aramaya başlamak ister misiniz?')) {
                useDefaultLocation();
            }
        }, 2000);
        return;
    }
    
    // Konum izni kontrolü
    navigator.permissions.query({name: 'geolocation'}).then(function(result) {
        console.log('Konum izni durumu:', result.state);
        
        if (result.state === 'denied') {
            updateStatus('Konum izni reddedildi. Lütfen tarayıcı ayarlarından konum iznini açın.', 'error');
            resetButton();
            
            // Alternatif çözüm öner
            setTimeout(() => {
                if (confirm('Konum izni reddedildi. İstanbul merkezinden aramaya başlamak ister misiniz?')) {
                    useDefaultLocation();
                }
            }, 2000);
            return;
        }
        
        // Konumu al
        navigator.geolocation.getCurrentPosition(
            onLocationSuccess,
            onLocationError,
            {
                enableHighAccuracy: true,
                timeout: 15000, // 15 saniye timeout
                maximumAge: 300000 // 5 dakika
            }
        );
    }).catch(function(error) {
        console.error('Konum izni kontrolü hatası:', error);
        // Eski yöntemle devam et
        navigator.geolocation.getCurrentPosition(
            onLocationSuccess,
            onLocationError,
            {
                enableHighAccuracy: false, // Daha az hassas ama daha hızlı
                timeout: 10000,
                maximumAge: 600000 // 10 dakika
            }
        );
    });
}

// Varsayılan konum kullan (İstanbul)
function useDefaultLocation() {
    currentPosition = {
        lat: 41.0082,
        lng: 28.9784
    };
    
    console.log('Varsayılan konum kullanılıyor:', currentPosition);
    
    // Haritayı varsayılan konuma odakla
    map.setView([currentPosition.lat, currentPosition.lng], 13);
    
    // Kullanıcı işaretçisini ekle
    if (userMarker) {
        map.removeLayer(userMarker);
    }
    
    userMarker = L.marker([currentPosition.lat, currentPosition.lng], {
        icon: L.divIcon({
            className: 'user-location-marker',
            html: '<i class="fas fa-map-marker-alt" style="color: #17a2b8; font-size: 20px;"></i>',
            iconSize: [30, 30]
        })
    }).addTo(map);
    
    userMarker.bindPopup('Varsayılan Konum (İstanbul)').openPopup();
    
    // Bilgi mesajı
    updateStatus('Varsayılan konum kullanılıyor (İstanbul)', 'info');
    
    // Filtreleri göster
    document.getElementById('filtersContainer').style.display = 'block';
    
    // Yakındaki mekanları ara
    searchNearbyPlaces();
    
    resetButton();
}

// Konum bulma başarılı
function onLocationSuccess(position) {
    currentPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };
    
    console.log('Konum bulundu:', currentPosition);
    
    // Haritayı kullanıcının konumuna odakla
    map.setView([currentPosition.lat, currentPosition.lng], 15);
    
    // Kullanıcı işaretçisini ekle/güncelle
    if (userMarker) {
        map.removeLayer(userMarker);
    }
    
    userMarker = L.marker([currentPosition.lat, currentPosition.lng], {
        icon: L.divIcon({
            className: 'user-location-marker',
            html: '<i class="fas fa-user" style="color: #007bff; font-size: 20px;"></i>',
            iconSize: [30, 30]
        })
    }).addTo(map);
    
    userMarker.bindPopup('Konumunuz').openPopup();
    
    // Başarı mesajı
    updateStatus('Konumunuz başarıyla bulundu!', 'success');
    
    // Filtreleri göster
    document.getElementById('filtersContainer').style.display = 'block';
    
    // Yakındaki mekanları ara
    searchNearbyPlaces();
    
    resetButton();
}

// Konum bulma başarısız
function onLocationError(error) {
    let errorMessage = 'Konum bulunamadı: ';
    let showDefaultOption = false;
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            errorMessage += 'Konum erişimi reddedildi.';
            showDefaultOption = true;
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage += 'Konum bilgisi mevcut değil.';
            showDefaultOption = true;
            break;
        case error.TIMEOUT:
            errorMessage += 'Konum bulma işlemi zaman aşımına uğradı.';
            showDefaultOption = true;
            break;
        default:
            errorMessage += 'Bilinmeyen bir hata oluştu.';
            showDefaultOption = true;
            break;
    }
    
    console.error('Konum hatası:', error);
    updateStatus(errorMessage, 'error');
    resetButton();
    
    // Varsayılan konum seçeneği sun
    if (showDefaultOption) {
        setTimeout(() => {
            if (confirm(errorMessage + '\n\nİstanbul merkezinden aramaya başlamak ister misiniz?')) {
                useDefaultLocation();
            }
        }, 2000);
    }
}

// Durum mesajını güncelle
function updateStatus(message, type) {
    const statusDiv = document.getElementById('locationStatus');
    statusDiv.textContent = message;
    statusDiv.className = `status-message status-${type}`;
}

// Butonu eski haline getir
function resetButton() {
    const btn = document.getElementById('findLocationBtn');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-crosshairs"></i> Konumumu Bul';
}

// Yakındaki mekanları ara (Overpass API kullanarak)
function searchNearbyPlaces() {
    if (!currentPosition) return;
    
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultsContainer = document.getElementById('resultsContainer');
    
    // Loading göster
    loadingSpinner.style.display = 'block';
    resultsContainer.innerHTML = '';
    
    // Mevcut mekan işaretçilerini temizle
    clearPlaceMarkers();
    
    // Seçili mesafe filtresini al
    const maxDistance = parseFloat(document.getElementById('distanceFilter').value);
    const radius = maxDistance * 1000; // km'yi metre'ye çevir
    
    // Overpass API sorgusu oluştur
    const query = buildOverpassQuery(currentPosition.lat, currentPosition.lng, radius);
    
    console.log('Overpass sorgusu gönderiliyor...', `Radius: ${radius}m`);
    
    // Overpass API'ye istek gönder
    fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
    })
    .then(response => response.json())
    .then(data => {
        console.log('Overpass API yanıtı:', data);
        processPlacesData(data.elements);
    })
    .catch(error => {
        console.error('Overpass API hatası:', error);
        updateStatus('Yakındaki mekanlar aranırken hata oluştu.', 'error');
    })
    .finally(() => {
        loadingSpinner.style.display = 'none';
    });
}

// Overpass API sorgusu oluştur
function buildOverpassQuery(lat, lng, radius) {
    return `
        [out:json][timeout:25];
        (
          node["amenity"~"^(restaurant|cafe|fast_food|bar|pub)$"](around:${radius},${lat},${lng});
          way["amenity"~"^(restaurant|cafe|fast_food|bar|pub)$"](around:${radius},${lat},${lng});
        );
        out geom;
    `;
}

// Mekan verilerini işle
function processPlacesData(elements) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (!elements || elements.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">Yakında restoran veya kafe bulunamadı.</p>';
        updateResultsCount(0);
        return;
    }
    
    console.log(`${elements.length} mekan bulundu`);
    
    // Mekanları işle
    allPlaces = elements
        .filter(element => element.tags && element.tags.name)
        .map(element => {
            const lat = element.lat || (element.center ? element.center.lat : null);
            const lng = element.lon || (element.center ? element.center.lon : null);
            
            if (!lat || !lng) return null;
            
            const distance = calculateDistance(currentPosition.lat, currentPosition.lng, lat, lng);
            
            return {
                id: element.id,
                name: element.tags.name,
                type: element.tags.amenity,
                cuisine: element.tags.cuisine || 'Belirtilmemiş',
                address: buildAddress(element.tags),
                phone: element.tags.phone || null,
                website: element.tags.website || null,
                opening_hours: element.tags.opening_hours || null,
                wifi: element.tags.wifi || element.tags['internet_access:wifi'] || null,
                wheelchair: element.tags.wheelchair || null,
                takeaway: element.tags.takeaway || null,
                delivery: element.tags.delivery || null,
                outdoor_seating: element.tags.outdoor_seating || null,
                smoking: element.tags.smoking || null,
                payment_cards: element.tags['payment:credit_cards'] || null,
                lat: lat,
                lng: lng,
                distance: distance,
                tags: element.tags
            };
        })
        .filter(place => place !== null);
    
    // İlk yüklemede filtreleri uygula
    applyFilters();
    
    // Arama geçmişine ekle
    addToSearchHistory();
    
    // Otomatik etiketleri oluştur
    generateAutoTags();
    
    // DEBUG: Bulunan mekanları console'a yazdır
    console.log('🏪 BULUNAN MEKANLAR LİSTESİ:');
    console.log('============================');
    allPlaces.forEach((place, index) => {
        const normalized = place.name.toLowerCase()
            .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
            .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
            .replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
        console.log(`${index + 1}. "${place.name}" → normalize: "${normalized}" → tip: ${place.type}`);
    });
    console.log('============================');
    console.log('💡 Yukarıdaki normalize isimleri JavaScript koduna ekleyebilirsiniz!');
}

// Mesafe hesapla (Haversine formülü)
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Dünya'nın yarıçapı (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Adres oluştur
function buildAddress(tags) {
    const parts = [];
    if (tags['addr:street']) parts.push(tags['addr:street']);
    if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
    if (tags['addr:neighbourhood']) parts.push(tags['addr:neighbourhood']);
    if (tags['addr:district']) parts.push(tags['addr:district']);
    
    return parts.length > 0 ? parts.join(', ') : 'Adres bilgisi yok';
}

// Mekanları görüntüle
function displayPlaces(places) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (places.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">Seçilen kriterlere uygun mekan bulunamadı.</p>';
        return;
    }
    
    const placesHTML = places.map(place => {
        const typeText = getTypeText(place.type);
        const distanceText = place.distance < 1 ? 
            `${Math.round(place.distance * 1000)}m` : 
            `${place.distance.toFixed(1)}km`;
        
        const isFavorite = favorites.includes(place.id);
        const favoriteClass = isFavorite ? 'favorite-active' : '';
        const favoriteIcon = isFavorite ? 'fas fa-heart' : 'far fa-heart';
        
        // Website linkini kontrol et ve temizle
        const websiteUrl = getCleanWebsiteUrl(place);
        
        // Kullanıcı notu var mı kontrol et
        const hasNote = userNotes[place.id] && userNotes[place.id].note.trim();
        const notePreview = hasNote ? userNotes[place.id].note.substring(0, 50) + (userNotes[place.id].note.length > 50 ? '...' : '') : '';
        
        // Mekan etiketlerini al
        const tags = getPlaceTags(place);
        
        return `
            <div class="place-card" onclick="openPlaceModal('${place.id}')">
                <div class="place-content">
                    <div class="place-header">
                        <div class="place-name">${place.name}</div>
                        <div class="place-header-actions">
                            <button class="tags-btn" onclick="event.stopPropagation(); openTagsModal('${place.id}')" title="Etiketleri düzenle">
                                <i class="fas fa-tags"></i>
                            </button>
                            ${hasNote ? `
                            <button class="note-indicator" onclick="event.stopPropagation(); openNoteModal('${place.id}')" title="Not var: ${notePreview}">
                                <i class="fas fa-sticky-note"></i>
                            </button>
                            ` : `
                            <button class="note-btn" onclick="event.stopPropagation(); openNoteModal('${place.id}')" title="Not ekle">
                                <i class="far fa-sticky-note"></i>
                            </button>
                            `}
                            <button class="favorite-btn ${favoriteClass}" onclick="event.stopPropagation(); toggleFavorite('${place.id}', this)" title="Favorilere ekle/çıkar">
                                <i class="${favoriteIcon}"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Etiketler -->
                    ${tags.length > 0 ? `
                    <div class="place-tags">
                        ${tags.slice(0, 4).map(tag => `<span class="place-tag">${tag}</span>`).join('')}
                        ${tags.length > 4 ? `<span class="place-tag-more">+${tags.length - 4}</span>` : ''}
                    </div>
                    ` : ''}
                    
                    ${hasNote ? `
                    <div class="place-note-preview">
                        <i class="fas fa-quote-left"></i>
                        <span class="note-text">${notePreview}</span>
                        <small class="note-date">${formatNoteDate(userNotes[place.id].date)}</small>
                    </div>
                    ` : ''}
                    <div class="place-details">
                        <span class="place-type">${typeText}</span>
                        <span class="place-type place-distance">${distanceText}</span>
                    </div>
                    <div class="place-info">
                        <div class="place-address">
                            <i class="fas fa-map-marker-alt"></i>
                            ${place.address}
                        </div>
                        ${place.phone ? `<div class="place-phone"><i class="fas fa-phone"></i> ${place.phone}</div>` : ''}
                        ${place.opening_hours ? `<div class="place-hours"><i class="fas fa-clock"></i> ${place.opening_hours}</div>` : ''}
                        ${websiteUrl ? `
                        <div class="place-website">
                            <i class="fas fa-globe"></i>
                            <a href="${websiteUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">
                                ${getDomainName(websiteUrl)}
                            </a>
                        </div>` : ''}
                    </div>
                    <div class="card-actions">
                        <div class="action-buttons">
                            <button class="action-btn" onclick="event.stopPropagation(); focusOnPlace(${place.lat}, ${place.lng}, '${place.name}')" title="Haritada göster">
                                <i class="fas fa-map-marked-alt"></i>
                            </button>
                            <a href="https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}" 
                               target="_blank" class="action-btn" onclick="event.stopPropagation()" title="Yol tarifi al">
                                <i class="fas fa-directions"></i>
                            </a>
                            ${place.phone ? `
                            <a href="tel:${place.phone}" class="action-btn" onclick="event.stopPropagation()" title="Ara">
                                <i class="fas fa-phone"></i>
                            </a>` : ''}
                            ${websiteUrl ? `
                            <a href="${websiteUrl}" target="_blank" rel="noopener noreferrer" class="action-btn" onclick="event.stopPropagation()" title="Website">
                                <i class="fas fa-external-link-alt"></i>
                            </a>` : ''}
                        </div>
                        <small class="view-details">Detaylar için kartı tıklayın</small>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    resultsContainer.innerHTML = placesHTML;
}

// Mekan tipini Türkçe çevir
function getTypeText(type) {
    const types = {
        'restaurant': 'Restoran',
        'cafe': 'Kafe',
        'fast_food': 'Fast Food',
        'bar': 'Bar',
        'pub': 'Pub'
    };
    return types[type] || type;
}

// Mekana odaklan
function focusOnPlace(lat, lng, name) {
    map.setView([lat, lng], 18);
    
    // O konumdaki marker'ı bul ve popup'ını aç
    placesMarkers.forEach(marker => {
        if (marker.getLatLng().lat === lat && marker.getLatLng().lng === lng) {
            marker.openPopup();
        }
    });
}

// Haritaya mekan işaretçilerini ekle
function addPlaceMarkers(places) {
    places.forEach(place => {
        const icon = getPlaceIcon(place.type);
        
        const marker = L.marker([place.lat, place.lng], {
            icon: L.divIcon({
                className: 'place-marker',
                html: `<i class="${icon}" style="color: #28a745; font-size: 16px;"></i>`,
                iconSize: [25, 25]
            })
        }).addTo(map);
        
        const distanceText = place.distance < 1 ? 
            `${Math.round(place.distance * 1000)}m` : 
            `${place.distance.toFixed(1)}km`;
        
        marker.bindPopup(`
            <strong>${place.name}</strong><br>
            <em>${getTypeText(place.type)}</em><br>
            <small>${distanceText} uzakta</small><br>
            <small>${place.address}</small>
        `);
        
        placesMarkers.push(marker);
    });
}

// Mekan tipine göre ikon seç
function getPlaceIcon(type) {
    const icons = {
        'restaurant': 'fas fa-utensils',
        'cafe': 'fas fa-coffee',
        'fast_food': 'fas fa-hamburger',
        'bar': 'fas fa-cocktail',
        'pub': 'fas fa-beer'
    };
    return icons[type] || 'fas fa-map-marker-alt';
}

// Website URL'ini temizle ve düzenle
function getCleanWebsiteUrl(place) {
    let url = place.website;
    
    // Eğer website yoksa, popüler mekanlar için varsayılan website'leri ekle
    if (!url && place.name) {
        url = getDefaultWebsite(place.name, place.type);
    }
    
    if (!url) return null;
    
    // URL'yi temizle ve düzenle
    url = url.trim();
    
    // Eğer http/https ile başlamıyorsa ekle
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    try {
        // URL'nin geçerli olup olmadığını kontrol et
        new URL(url);
        return url;
    } catch (error) {
        console.warn('Geçersiz URL:', url);
        return null;
    }
}

// Popüler mekanlar için varsayılan website'ler
function getDefaultWebsite(placeName, placeType) {
    const name = placeName.toLowerCase();
    
    // Zincir markalar için bilinen website'ler
    const knownWebsites = {
        'mcdonald': 'https://www.mcdonalds.com.tr',
        'mcdonalds': 'https://www.mcdonalds.com.tr',
        'burger king': 'https://www.burgerking.com.tr',
        'burgerking': 'https://www.burgerking.com.tr',
        'kfc': 'https://www.kfc.com.tr',
        'dominos': 'https://www.dominos.com.tr',
        'pizza hut': 'https://www.pizzahut.com.tr',
        'pizzahut': 'https://www.pizzahut.com.tr',
        'starbucks': 'https://www.starbucks.com.tr',
        'popeyes': 'https://www.popeyes.com.tr',
        'subway': 'https://www.subway.com/tr',
        'tavuk dünyası': 'https://www.tavukdunyasi.com.tr',
        'tavukdunyasi': 'https://www.tavukdunyasi.com.tr',
        'kahve dünyası': 'https://www.kahvedunyasi.com',
        'kahvedunyasi': 'https://www.kahvedunyasi.com',
        'mado': 'https://www.mado.com.tr',
        'komagene': 'https://www.komagene.com.tr',
        'usta dönerci': 'https://www.ustadoner.com.tr',
    };
    
    // İsim eşleşmesi ara
    for (const [key, website] of Object.entries(knownWebsites)) {
        if (name.includes(key) || key.includes(name.replace(/\s+/g, ''))) {
            return website;
        }
    }
    
    return null;
}

// Domain adını al (görüntüleme için)
function getDomainName(url) {
    try {
        const urlObj = new URL(url);
        let domain = urlObj.hostname;
        
        // www. kısmını kaldır
        if (domain.startsWith('www.')) {
            domain = domain.substring(4);
        }
        
        return domain;
    } catch (error) {
        return url;
    }
}

// Mekan işaretçilerini temizle
function clearPlaceMarkers() {
    placesMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
    placesMarkers = [];
}

// Filtreleri uygula
function applyFilters() {
    if (!allPlaces || allPlaces.length === 0) return;
    
    const typeFilter = document.getElementById('typeFilter').value;
    const maxDistance = parseFloat(document.getElementById('distanceFilter').value);
    const sortBy = document.getElementById('sortFilter').value;
    
    // Tip filtresini uygula
    let filtered = allPlaces;
    if (typeFilter !== 'all') {
        filtered = filtered.filter(place => place.type === typeFilter);
    }
    
    // Mesafe filtresini uygula
    filtered = filtered.filter(place => place.distance <= maxDistance);
    
    // Sıralama uygula
    if (sortBy === 'distance') {
        filtered.sort((a, b) => a.distance - b.distance);
    } else if (sortBy === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    }
    
    // Maksimum 30 mekan göster
    filteredPlaces = filtered.slice(0, 30);
    
    // Sonuçları güncelle
    displayPlaces(filteredPlaces);
    updateResultsCount(filteredPlaces.length);
    
    // Harita işaretçilerini güncelle
    clearPlaceMarkers();
    addPlaceMarkers(filteredPlaces);
    
    console.log(`${filtered.length} mekan filtrelendi, ${filteredPlaces.length} tanesi gösteriliyor`);
}

// Sonuç sayısını güncelle
function updateResultsCount(count) {
    const resultsCount = document.getElementById('resultsCount');
    if (count === 0) {
        resultsCount.textContent = 'Sonuç yok';
        resultsCount.style.background = '#dc3545';
    } else {
        resultsCount.textContent = `${count} mekan`;
        resultsCount.style.background = '#667eea';
    }
}

// Favorileri yükle
function loadFavorites() {
    const saved = localStorage.getItem('restaurant-favorites');
    favorites = saved ? JSON.parse(saved) : [];
    console.log('Favoriler yüklendi:', favorites);
}

// Favorileri kaydet
function saveFavorites() {
    localStorage.setItem('restaurant-favorites', JSON.stringify(favorites));
    console.log('Favoriler kaydedildi:', favorites);
}

// Favori toggle işlemi
function toggleFavorite(placeId, buttonElement) {
    const index = favorites.indexOf(placeId);
    const icon = buttonElement.querySelector('i');
    
    if (index === -1) {
        // Favorilere ekle
        favorites.push(placeId);
        buttonElement.classList.add('favorite-active');
        icon.className = 'fas fa-heart';
        
        // Bildirim göster
        showNotification('Favorilere eklendi!', 'success');
    } else {
        // Favorilerden çıkar
        favorites.splice(index, 1);
        buttonElement.classList.remove('favorite-active');
        icon.className = 'far fa-heart';
        
        // Bildirim göster
        showNotification('Favorilerden çıkarıldı!', 'info');
    }
    
    saveFavorites();
}

// Bildirim göster
function showNotification(message, type) {
    // Mevcut bildirimi kaldır
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    // Yeni bildirim oluştur
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : 'info'}-circle"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    // Animasyon ile göster
    setTimeout(() => notification.classList.add('show'), 100);
    
    // 3 saniye sonra kaldır
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Mekan modalını aç
function openPlaceModal(placeId) {
    const place = allPlaces.find(p => p.id === placeId);
    if (!place) return;
    
    // Ziyaret edilen mekanları kaydet
    visitedPlaces.add(placeId);
    saveVisitedPlaces();
    
    const modal = document.getElementById('placeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    
    modalTitle.textContent = place.name;
    
    const distanceText = place.distance < 1 ? 
        `${Math.round(place.distance * 1000)} metre` : 
        `${place.distance.toFixed(1)} km`;
    
    const isFavorite = favorites.includes(place.id);
    const favoriteText = isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle';
    const favoriteIcon = isFavorite ? 'fas fa-heart-broken' : 'fas fa-heart';
    
    modalContent.innerHTML = `
        <div class="modal-detail-item">
            <i class="fas fa-utensils"></i>
            <div class="modal-detail-content">
                <div class="modal-detail-label">Mekan Tipi</div>
                <div class="modal-detail-value">${getTypeText(place.type)}</div>
            </div>
        </div>
        
        <div class="modal-detail-item">
            <i class="fas fa-map-marker-alt"></i>
            <div class="modal-detail-content">
                <div class="modal-detail-label">Adres</div>
                <div class="modal-detail-value">${place.address}</div>
            </div>
        </div>
        
        <div class="modal-detail-item">
            <i class="fas fa-route"></i>
            <div class="modal-detail-content">
                <div class="modal-detail-label">Mesafe</div>
                <div class="modal-detail-value">${distanceText} uzaklıkta</div>
            </div>
        </div>
        
        ${place.phone ? `
        <div class="modal-detail-item">
            <i class="fas fa-phone"></i>
            <div class="modal-detail-content">
                <div class="modal-detail-label">Telefon</div>
                <div class="modal-detail-value">${place.phone}</div>
            </div>
        </div>
        ` : ''}
        
        ${place.opening_hours ? `
        <div class="modal-detail-item">
            <i class="fas fa-clock"></i>
            <div class="modal-detail-content">
                <div class="modal-detail-label">Çalışma Saatleri</div>
                <div class="modal-detail-value">${place.opening_hours}</div>
            </div>
        </div>
        ` : ''}
        
        ${place.cuisine !== 'Belirtilmemiş' ? `
        <div class="modal-detail-item">
            <i class="fas fa-cookie-bite"></i>
            <div class="modal-detail-content">
                <div class="modal-detail-label">Mutfak</div>
                <div class="modal-detail-value">${place.cuisine}</div>
            </div>
        </div>
        ` : ''}
        
        ${place.website ? `
        <div class="modal-detail-item">
            <i class="fas fa-globe"></i>
            <div class="modal-detail-content">
                <div class="modal-detail-label">Website</div>
                <div class="modal-detail-value"><a href="${place.website}" target="_blank" rel="noopener">${place.website}</a></div>
            </div>
        </div>
        ` : ''}
        
        <!-- Kullanıcı Notu -->
        <div class="user-note-section">
            <h4><i class="fas fa-sticky-note"></i> Kişisel Notlarım</h4>
            ${userNotes[place.id] ? `
                <div class="current-note">
                    <div class="note-content">"${userNotes[place.id].note}"</div>
                    <div class="note-meta">
                        <small><i class="fas fa-calendar"></i> ${formatNoteDate(userNotes[place.id].date)}</small>
                        <button class="edit-note-btn" onclick="openNoteModal('${place.id}')">
                            <i class="fas fa-edit"></i> Düzenle
                        </button>
                    </div>
                </div>
            ` : `
                <div class="no-note">
                    <p>Bu mekan için henüz not eklememişsiniz.</p>
                    <button class="add-note-btn" onclick="openNoteModal('${place.id}')">
                        <i class="fas fa-plus"></i> Not Ekle
                    </button>
                </div>
            `}
        </div>
        
        <!-- Özellikler -->
        <div class="features-section">
            <h4><i class="fas fa-star"></i> Özellikler</h4>
            <div class="features-grid">
                ${place.wifi === 'yes' ? '<div class="feature-item feature-yes"><i class="fas fa-wifi"></i> WiFi Var</div>' : ''}
                ${place.wifi === 'no' ? '<div class="feature-item feature-no"><i class="fas fa-wifi"></i> WiFi Yok</div>' : ''}
                ${place.wheelchair === 'yes' ? '<div class="feature-item feature-yes"><i class="fas fa-wheelchair"></i> Erişilebilir</div>' : ''}
                ${place.takeaway === 'yes' ? '<div class="feature-item feature-yes"><i class="fas fa-shopping-bag"></i> Paket Servis</div>' : ''}
                ${place.delivery === 'yes' ? '<div class="feature-item feature-yes"><i class="fas fa-truck"></i> Teslimat</div>' : ''}
                ${place.outdoor_seating === 'yes' ? '<div class="feature-item feature-yes"><i class="fas fa-tree"></i> Açık Hava Oturma</div>' : ''}
                ${place.smoking === 'no' ? '<div class="feature-item feature-yes"><i class="fas fa-smoking-ban"></i> Sigara İçilmez</div>' : ''}
                ${place.payment_cards === 'yes' ? '<div class="feature-item feature-yes"><i class="fas fa-credit-card"></i> Kart Kabul</div>' : ''}
            </div>
        </div>
        
        <div class="modal-actions">
            <button class="modal-btn modal-btn-primary" onclick="focusOnPlace(${place.lat}, ${place.lng}, '${place.name}'); closeModal();">
                <i class="fas fa-map-marked-alt"></i>
                Haritada Göster
            </button>
            
            <button class="modal-btn modal-btn-secondary" onclick="toggleFavoriteModal('${place.id}', this)">
                <i class="${favoriteIcon}"></i>
                ${favoriteText}
            </button>
            
            <a href="https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}" 
               target="_blank" class="modal-btn modal-btn-primary">
                <i class="fas fa-directions"></i>
                Yol Tarifi Al
            </a>
            
            ${place.phone ? `
            <a href="tel:${place.phone}" class="modal-btn modal-btn-secondary">
                <i class="fas fa-phone"></i>
                Ara
            </a>
            ` : ''}
            
            ${place.website ? `
            <a href="${place.website}" target="_blank" rel="noopener" class="modal-btn modal-btn-secondary">
                <i class="fas fa-external-link-alt"></i>
                Website
            </a>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Sayfa kaydırmayı engelle
}

// Modalı kapat
function closeModal() {
    const modal = document.getElementById('placeModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Sayfa kaydırmayı geri aç
}

// Modal'dan favori toggle
function toggleFavoriteModal(placeId, buttonElement) {
    const index = favorites.indexOf(placeId);
    const icon = buttonElement.querySelector('i');
    
    if (index === -1) {
        favorites.push(placeId);
        buttonElement.innerHTML = '<i class="fas fa-heart-broken"></i> Favorilerden Çıkar';
        showNotification('Favorilere eklendi!', 'success');
    } else {
        favorites.splice(index, 1);
        buttonElement.innerHTML = '<i class="fas fa-heart"></i> Favorilere Ekle';
        showNotification('Favorilerden çıkarıldı!', 'info');
    }
    
    saveFavorites();
    
    // Ana listedeki favoriler butonunu da güncelle
    applyFilters();
}

// API ayarlarını yükle
function loadApiSettings() {
    const saved = localStorage.getItem('unsplash-api-key');
    if (saved) {
        unsplashApiKey = saved;
        document.getElementById('unsplashApiKey').value = saved;
    }
}

// API ayarları panelini toggle et
function toggleApiSettingsPanel() {
    const container = document.getElementById('apiSettingsContainer');
    const isVisible = container.style.display !== 'none';
    container.style.display = isVisible ? 'none' : 'block';
}

// API ayarlarını kaydet
function saveApiSettings() {
    const apiKey = document.getElementById('unsplashApiKey').value.trim();
    unsplashApiKey = apiKey;
    localStorage.setItem('unsplash-api-key', apiKey);
    
    if (apiKey) {
        showNotification('API key başarıyla kaydedildi!', 'success');
    } else {
        showNotification('API key temizlendi', 'info');
    }
    
    // Paneli kapat
    document.getElementById('apiSettingsContainer').style.display = 'none';
    
    // Eğer mekanlar varsa fotoğrafları yeniden yükle
    if (filteredPlaces.length > 0) {
        photoCache.clear(); // Önbelleği temizle
        filteredPlaces.forEach(place => {
            loadPlacePhoto(place);
        });
    }
}

// Arama geçmişini yükle
function loadSearchHistory() {
    const saved = localStorage.getItem('search-history');
    searchHistory = saved ? JSON.parse(saved) : [];
    
    const visitedSaved = localStorage.getItem('visited-places');
    const visitedArray = visitedSaved ? JSON.parse(visitedSaved) : [];
    visitedPlaces = new Set(visitedArray);
}

// Arama geçmişine ekle
function addToSearchHistory() {
    if (!currentPosition) return;
    
    const searchData = {
        location: `${currentPosition.lat.toFixed(4)}, ${currentPosition.lng.toFixed(4)}`,
        timestamp: new Date().toISOString(),
        resultsCount: filteredPlaces.length
    };
    
    // Aynı konumu tekrar eklemeyeceğim için kontrol et
    const exists = searchHistory.some(search => 
        search.location === searchData.location && 
        new Date(search.timestamp).toDateString() === new Date().toDateString()
    );
    
    if (!exists) {
        searchHistory.unshift(searchData);
        // Son 10 aramayı sakla
        searchHistory = searchHistory.slice(0, 10);
        localStorage.setItem('search-history', JSON.stringify(searchHistory));
    }
}

// Ziyaret edilen mekanları kaydet
function saveVisitedPlaces() {
    localStorage.setItem('visited-places', JSON.stringify([...visitedPlaces]));
}

// İstatistik modalını göster
function showStatsModal() {
    const modal = document.getElementById('statsModal');
    const statsContent = document.getElementById('statsContent');
    
    // Favori mekanları al
    const favoriteData = allPlaces.filter(place => favorites.includes(place.id));
    
    // İstatistik verileri hesapla
    const totalSearches = searchHistory.length;
    const totalFavorites = favorites.length;
    const totalVisited = visitedPlaces.size;
    const mostVisitedType = getMostVisitedType();
    
    statsContent.innerHTML = `
        <!-- İstatistik kartları -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${totalSearches}</div>
                <div class="stat-label">Toplam Arama</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${totalFavorites}</div>
                <div class="stat-label">Favori Mekan</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${totalVisited}</div>
                <div class="stat-label">İncelenen Mekan</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${mostVisitedType}</div>
                <div class="stat-label">En Çok Tercih</div>
            </div>
        </div>
        
        <!-- Favoriler bölümü -->
        <div class="favorites-section">
            <h4><i class="fas fa-heart"></i> Favori Mekanlarınız</h4>
            ${favoriteData.length > 0 ? `
                <div class="favorites-list">
                    ${favoriteData.map(place => `
                        <div class="favorite-item">
                            <div class="favorite-info">
                                <div class="favorite-name">${place.name}</div>
                                <div class="favorite-details">
                                    ${getTypeText(place.type)} • ${place.address}
                                </div>
                            </div>
                            <div class="favorite-actions">
                                <button class="favorite-action-btn" onclick="focusOnPlaceFromStats(${place.lat}, ${place.lng}, '${place.name}')">
                                    <i class="fas fa-map-marker-alt"></i>
                                </button>
                                <button class="favorite-action-btn" onclick="removeFavoriteFromStats('${place.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : '<div class="no-favorites">Henüz favori mekanınız yok.</div>'}
        </div>
        
        <!-- Arama geçmişi -->
        <div class="recent-searches">
            <h4><i class="fas fa-history"></i> Son Aramalar</h4>
            ${searchHistory.length > 0 ? `
                <div class="search-history-list">
                    ${searchHistory.map(search => `
                        <div class="search-history-item">
                            <div>
                                <strong>${search.resultsCount} mekan bulundu</strong><br>
                                <small>${formatDate(search.timestamp)}</small>
                            </div>
                            <small>${search.location}</small>
                        </div>
                    `).join('')}
                </div>
            ` : '<div class="no-favorites">Arama geçmişi yok.</div>'}
        </div>
        
        <!-- Veri temizleme -->
        <div class="clear-data-section">
            <h4>Veri Yönetimi</h4>
            <button class="btn-danger" onclick="clearAllData()">
                <i class="fas fa-trash-alt"></i>
                Tüm Verileri Temizle
            </button>
        </div>
    `;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// İstatistik modalını kapat
function closeStatsModal() {
    const modal = document.getElementById('statsModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// En çok ziyaret edilen mekan tipini bul
function getMostVisitedType() {
    if (allPlaces.length === 0) return 'Veri Yok';
    
    const typeCount = {};
    allPlaces.forEach(place => {
        if (visitedPlaces.has(place.id)) {
            typeCount[place.type] = (typeCount[place.type] || 0) + 1;
        }
    });
    
    const mostVisited = Object.keys(typeCount).reduce((a, b) => 
        typeCount[a] > typeCount[b] ? a : b, Object.keys(typeCount)[0]
    );
    
    return mostVisited ? getTypeText(mostVisited) : 'Veri Yok';
}

// Tarihi formatla
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// İstatistiklerden mekana odaklan
function focusOnPlaceFromStats(lat, lng, name) {
    closeStatsModal();
    map.setView([lat, lng], 18);
    
    // O konumdaki marker'ı bul ve popup'ını aç
    placesMarkers.forEach(marker => {
        if (marker.getLatLng().lat === lat && marker.getLatLng().lng === lng) {
            marker.openPopup();
        }
    });
    
    showNotification(`${name} haritada gösteriliyor`, 'info');
}

// İstatistiklerden favori sil
function removeFavoriteFromStats(placeId) {
    const index = favorites.indexOf(placeId);
    if (index !== -1) {
        favorites.splice(index, 1);
        saveFavorites();
        showNotification('Favorilerden çıkarıldı!', 'info');
        
        // İstatistik modalını güncelle
        showStatsModal();
        
        // Ana listeyi güncelle
        if (filteredPlaces.length > 0) {
            applyFilters();
        }
    }
}

// Tüm verileri temizle
function clearAllData() {
    if (confirm('Tüm favori mekanlar, notlar, etiketler, arama geçmişi ve ayarlar silinecek. Emin misiniz?')) {
        localStorage.removeItem('restaurant-favorites');
        localStorage.removeItem('search-history');
        localStorage.removeItem('visited-places');
        localStorage.removeItem('unsplash-api-key');
        localStorage.removeItem('user-notes');
        localStorage.removeItem('place-tags');
        
        // Global değişkenleri sıfırla
        favorites = [];
        searchHistory = [];
        visitedPlaces = new Set();
        unsplashApiKey = '';
        photoCache.clear();
        userNotes = {};
        placeTags = {};
        
        // Form alanlarını temizle
        document.getElementById('unsplashApiKey').value = '';
        
        showNotification('Tüm veriler temizlendi!', 'success');
        closeStatsModal();
        
        // Ana listeyi güncelle
        if (filteredPlaces.length > 0) {
            applyFilters();
        }
    }
}
        searchHistory = [];
        visitedPlaces = new Set();
        unsplashApiKey = '';
        photoCache.clear();
        
        // Form alanlarını temizle
        document.getElementById('unsplashApiKey').value = '';
        
        showNotification('Tüm veriler temizlendi!', 'success');
        closeStatsModal();
        
        // Ana listeyi güncelle
        if (filteredPlaces.length > 0) {
            applyFilters();
        }
    

// Modal dışına tıklanınca kapat
document.addEventListener('click', function(event) {
    const placeModal = document.getElementById('placeModal');
    const statsModal = document.getElementById('statsModal');
    const noteModal = document.getElementById('noteModal');
    const tagsModal = document.getElementById('tagsModal');
    
    if (event.target === placeModal) {
        closeModal();
    }
    if (event.target === statsModal) {
        closeStatsModal();
    }
    if (event.target === noteModal) {
        closeNoteModal();
    }
    if (event.target === tagsModal) {
        closeTagsModal();
    }
});

// ESC tuşu ile modalları kapat
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
        closeStatsModal();
        closeNoteModal();
        closeTagsModal();
    }
});

// Kullanıcı notlarını yükle
function loadUserNotes() {
    const saved = localStorage.getItem('user-notes');
    userNotes = saved ? JSON.parse(saved) : {};
    console.log('Kullanıcı notları yüklendi:', Object.keys(userNotes).length, 'not');
}

// Kullanıcı notlarını kaydet
function saveUserNotes() {
    localStorage.setItem('user-notes', JSON.stringify(userNotes));
    console.log('Kullanıcı notları kaydedildi');
}

// Not modalını aç
let currentNotePlace = null;
function openNoteModal(placeId) {
    const place = allPlaces.find(p => p.id === placeId);
    if (!place) return;
    
    currentNotePlace = place;
    const modal = document.getElementById('noteModal');
    const modalTitle = document.getElementById('noteModalTitle');
    const placeName = document.getElementById('notePlaceName');
    const placeAddress = document.getElementById('notePlaceAddress');
    const textarea = document.getElementById('noteTextarea');
    const deleteBtn = document.getElementById('deleteNoteBtn');
    
    // Modal bilgilerini doldur
    placeName.textContent = place.name;
    placeAddress.textContent = place.address;
    
    // Mevcut notu varsa doldur
    if (userNotes[placeId]) {
        modalTitle.textContent = 'Notu Düzenle';
        textarea.value = userNotes[placeId].note;
        deleteBtn.style.display = 'inline-block';
    } else {
        modalTitle.textContent = 'Not Ekle';
        textarea.value = '';
        deleteBtn.style.display = 'none';
    }
    
    // Karakter sayacını güncelle
    updateCharCounter();
    
    // Modal'ı göster
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Textarea'ya odaklan
    setTimeout(() => {
        textarea.focus();
    }, 100);
}

// Not modalını kapat
function closeNoteModal() {
    const modal = document.getElementById('noteModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentNotePlace = null;
}

// Hızlı not ekleme
function addSuggestion(text) {
    const textarea = document.getElementById('noteTextarea');
    const currentText = textarea.value.trim();
    
    if (currentText) {
        textarea.value = currentText + ' • ' + text;
    } else {
        textarea.value = text;
    }
    
    updateCharCounter();
    textarea.focus();
}

// Karakter sayacını güncelle
function updateCharCounter() {
    const textarea = document.getElementById('noteTextarea');
    const charCount = document.getElementById('charCount');
    
    if (textarea && charCount) {
        const length = textarea.value.length;
        charCount.textContent = length;
        
        // Limit aşılırsa kırmızı yap
        if (length > 450) {
            charCount.style.color = '#dc3545';
        } else if (length > 400) {
            charCount.style.color = '#ffc107';
        } else {
            charCount.style.color = '#6c757d';
        }
    }
}

// Not modalını aç - Global fonksiyon olarak yeniden tanımla
window.openNoteModal = function(placeId) {
    console.log('🔔 Not modal açılıyor, placeId:', placeId);
    
    const place = allPlaces.find(p => p.id === placeId);
    if (!place) {
        console.error('❌ Mekan bulunamadı:', placeId);
        return;
    }
    
    console.log('✅ Mekan bulundu:', place.name);
    
    currentNotePlace = place;
    const modal = document.getElementById('noteModal');
    
    if (!modal) {
        console.error('❌ Note modal element bulunamadı!');
        return;
    }
    
    const modalTitle = document.getElementById('noteModalTitle');
    const placeName = document.getElementById('notePlaceName');
    const placeAddress = document.getElementById('notePlaceAddress');
    const textarea = document.getElementById('noteTextarea');
    const deleteBtn = document.getElementById('deleteNoteBtn');
    
    // Modal bilgilerini doldur
    placeName.textContent = place.name;
    placeAddress.textContent = place.address;
    
    // Mevcut notu varsa doldur
    if (userNotes[placeId]) {
        modalTitle.textContent = 'Notu Düzenle';
        textarea.value = userNotes[placeId].note;
        deleteBtn.style.display = 'inline-block';
        console.log('📝 Mevcut not yüklendi');
    } else {
        modalTitle.textContent = 'Not Ekle';
        textarea.value = '';
        deleteBtn.style.display = 'none';
        console.log('✨ Yeni not modali');
    }
    
    // Karakter sayacını güncelle
    updateCharCounter();
    
    // Modal'ı göster
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Modal açıldı');
    
    // Textarea'ya odaklan
    setTimeout(() => {
        if (textarea) {
            textarea.focus();
        }
    }, 100);
};

// Not modalını kapat - Global fonksiyon
window.closeNoteModal = function() {
    console.log('🔔 Not modal kapanıyor');
    const modal = document.getElementById('noteModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        currentNotePlace = null;
        console.log('✅ Modal kapandı');
    }
};

// Hızlı not ekleme - Global fonksiyon
window.addSuggestion = function(text) {
    console.log('🔔 Hızlı not ekleniyor:', text);
    const textarea = document.getElementById('noteTextarea');
    if (!textarea) return;
    
    const currentText = textarea.value.trim();
    
    if (currentText) {
        textarea.value = currentText + ' • ' + text;
    } else {
        textarea.value = text;
    }
    
    updateCharCounter();
    textarea.focus();
};

// Kullanıcı notunu kaydet - Global fonksiyon
window.saveUserNote = function() {
    console.log('🔔 Not kaydediliyor');
    
    if (!currentNotePlace) {
        console.error('❌ Aktif mekan yok!');
        return;
    }
    
    const textarea = document.getElementById('noteTextarea');
    if (!textarea) {
        console.error('❌ Textarea bulunamadı!');
        return;
    }
    
    const noteText = textarea.value.trim();
    
    if (!noteText) {
        showNotification('Lütfen bir not yazın!', 'error');
        return;
    }
    
    if (noteText.length > 500) {
        showNotification('Not çok uzun! Maksimum 500 karakter.', 'error');
        return;
    }
    
    // Notu kaydet
    userNotes[currentNotePlace.id] = {
        note: noteText,
        date: new Date().toISOString(),
        placeName: currentNotePlace.name
    };
    
    saveUserNotes();
    showNotification('Not başarıyla kaydedildi!', 'success');
    
    console.log('✅ Not kaydedildi:', currentNotePlace.name);
    
    // Modal'ı kapat
    closeNoteModal();
    
    // Listeyi güncelle
    applyFilters();
};

// Kullanıcı notunu sil - Global fonksiyon
window.deleteUserNote = function() {
    console.log('🔔 Not siliniyor');
    
    if (!currentNotePlace) return;
    
    if (confirm('Bu notu silmek istediğinizden emin misiniz?')) {
        delete userNotes[currentNotePlace.id];
        saveUserNotes();
        showNotification('Not silindi!', 'info');
        
        console.log('✅ Not silindi:', currentNotePlace.name);
        
        // Modal'ı kapat
        closeNoteModal();
        
        // Listeyi güncelle
        applyFilters();
    }
};

// Not tarihini formatla
function formatNoteDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
        return 'Bugün';
    } else if (days === 1) {
        return 'Dün';
    } else if (days < 7) {
        return `${days} gün önce`;
    } else {
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short'
        });
    }
}

// DEBUG: Not sistemi test fonksiyonu
window.testNoteSystem = function() {
    console.log('🧪 NOT SİSTEMİ TEST EDILIYOR');
    console.log('============================');
    
    // Modal element kontrolü
    const modal = document.getElementById('noteModal');
    console.log('Note Modal element:', modal ? '✅ Bulundu' : '❌ Bulunamadı');
    
    // Fonksiyon kontrolü
    console.log('openNoteModal fonksiyonu:', typeof window.openNoteModal);
    console.log('saveUserNote fonksiyonu:', typeof window.saveUserNote);
    console.log('closeNoteModal fonksiyonu:', typeof window.closeNoteModal);
    
    // Mekan listesi kontrolü
    console.log('Toplam mekan sayısı:', allPlaces.length);
    
    if (allPlaces.length > 0) {
        const testPlaceId = allPlaces[0].id;
        console.log('Test için mekan:', allPlaces[0].name);
        console.log('Test komutu: openNoteModal("' + testPlaceId + '")');
        
        // Test et
        try {
            window.openNoteModal(testPlaceId);
            console.log('✅ Test başarılı!');
        } catch (error) {
            console.error('❌ Test hatası:', error);
        }
    } else {
        console.log('⚠️ Önce "Konumumu Bul" butonuna tıklayın');
    }
    
    console.log('============================');
};