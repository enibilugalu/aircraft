const body = document.body
function loadAircraft() {
    let count = parseInt(countInput.value) || 1
    if (count > 15) count = 15
    if (count < 1) count = 1
    
    loadedAircrafts = []
    result.innerText = 'Загрузка данных...'
    
    mapLayers.forEach(layer => map.removeLayer(layer))
    mapLayers = []
    
    let loadedCount = 0
    
    for (let i = 0; i < count; i++) {
        fetch('https://api.adsbdb.com/v0/aircraft/random')
            .then(r => r.json())
            .then(data => {
                if (data.response && data.response.aircraft) {
                    const aircraft = data.response.aircraft
                    loadedAircrafts.push(aircraft)
                    showAircraft(aircraft, loadedAircrafts.length - 1)
                }
                loadedCount++
            })
            .catch(err => {
                console.error("Ошибка при загрузке самолёта:", err)
                loadedCount++
            })
    }
}

function showDetail(index) {
    const aircraft = loadedAircrafts[index]
    
    if (!aircraft) {
        console.error("Данные о самолёте не найдены по индексу:", index)
        result.innerText = "Ошибка: данные не найдены"
        return
    }

    result.innerText = ''
    
    const card = document.createElement('div')
    card.classList.add('card', 'detail-card')
    
    card.append(createImageBox(aircraft.url_photo))
    card.append(createItem('Регистрация', aircraft.registration))
    card.append(createItem('Mode S', aircraft.mode_s))
    card.append(createItem('Тип', aircraft.type))
    card.append(createItem('Производитель', aircraft.manufacturer))
    card.append(createItem('Владелец', aircraft.registered_owner))
    card.append(createItem('Страна', aircraft.registered_owner_country_name))
    
    const coordsSection = document.createElement('div')
    coordsSection.className = 'coords-loading'
    coordsSection.innerText = 'Загрузка координат маршрута'
    card.append(coordsSection)
    
    const backBtn = document.createElement('button')
    backBtn.innerText = 'Назад к списку'
    backBtn.addEventListener('click', showList)
    card.append(backBtn)
    
    result.append(card)
    
    fetch('https://api.adsbdb.com/v0/callsign/random')
        .then(r => r.json())
        .then(data => {
            coordsSection.innerText = ''
            coordsSection.classList.add('coords')
            
            if (data.response && data.response.flightroute) {
                const route = data.response.flightroute
                const origin = route.origin
                const destination = route.destination
                
                const originCoords = (origin.latitude && origin.longitude) 
                    ? `${origin.latitude}, ${origin.longitude}` 
                    : 'Нет данных'
                const destCoords = (destination.latitude && destination.longitude) 
                    ? `${destination.latitude}, ${destination.longitude}` 
                    : 'Нет данных'
                
                coordsSection.append(createItem('Аэропорт отправления', origin.name))
                coordsSection.append(createItem('Координаты отправления', originCoords))
                coordsSection.append(createItem('Аэропорт прибытия', destination.name))
                coordsSection.append(createItem('Координаты прибытия', destCoords))
                
                mapLayers.forEach(layer => map.removeLayer(layer))
                mapLayers = []
                
                if (origin.latitude && destination.latitude) {
                    const originMarkerCoords = [origin.latitude, origin.longitude]
                    const destinationMarkerCoords = [destination.latitude, destination.longitude]
                    
                    const originMarker = L.marker(originMarkerCoords)
                        .bindPopup(`Отправление: ${origin.name}`).addTo(map)
                    
                    const destinationMarker = L.marker(destinationMarkerCoords)
                        .bindPopup(`Прибытие: ${destination.name}`).addTo(map)
                    
                    const routeLine = L.polyline([originMarkerCoords, destinationMarkerCoords], {
                        className: 'flight-route-line'
                    }).addTo(map)
                    
                    mapLayers.push(originMarker, destinationMarker, routeLine)
                    
                    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] })
                }
            } else {
                coordsSection.innerText = 'нет данных о маршруте'
            }
        })
        .catch(() => {
            coordsSection.innerText = 'Ошибка загрузки координат'
        })
}
const mainContainer = document.createElement('div')
mainContainer.className = 'main-container'
body.append(mainContainer)

const leftPanel = document.createElement('div')
leftPanel.className = 'left-panel'
mainContainer.append(leftPanel)

const rightPanel = document.createElement('div')
rightPanel.className = 'right-panel'
mainContainer.append(rightPanel)

const controls = document.createElement('div')
controls.className = 'controls'

const countInput = document.createElement('input')
countInput.type = 'number'
countInput.className = 'count-input'
countInput.value = 1
countInput.min = 1
countInput.max = 15

const btn = document.createElement('button')
btn.innerText = 'Показать самолёты'

const btn5 = document.createElement('button')
btn5.className = 'btn-preset'
btn5.innerText = '5 карточек'

const btn10 = document.createElement('button')
btn10.className = 'btn-preset'
btn10.innerText = '10 карточек'

const btn15 = document.createElement('button')
btn15.className = 'btn-preset'
btn15.innerText = '15 карточек'

btn5.addEventListener('click', () =>{
    countInput.value = 5
    loadAircraft()
})

btn10.addEventListener('click', () =>{
    countInput.value = 10
    loadAircraft()
})

btn15.addEventListener('click', () =>{
    countInput.value = 15
    loadAircraft()
})

controls.append(countInput, btn, btn5, btn10, btn15)
leftPanel.append(controls)

const result = document.createElement('div')
result.id = 'result'
leftPanel.append(result)

const mapContainer = document.createElement('div')
mapContainer.id = 'map'
rightPanel.append(mapContainer)

const map = L.map('map', { attributionControl: false }).setView([51.505, -0.09], 1)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

let mapLayers = []
let loadedAircrafts = []

function createIcon(){
    const img = document.createElement('img')
    img.src = 'plane.svg'
    img.alt = 'Самолёт'
    img.classList.add('icon')
    img.onerror = function(){
        this.style.display = 'none'
    }
    return img
}

function createImageBox(url){
    const box = document.createElement('div')
    box.classList.add('image-box')
    if(url){
        const img = document.createElement('img')
        img.src = url
        img.onerror = function(){
            box.innerText = ''
            box.append(createIcon())
        }
        box.append(img)
    }else{
        box.append(createIcon())
    }
    return box
}

function createItem(label, value){
    const item = document.createElement('div')
    item.classList.add('item')
    const labelEl = document.createElement('span')
    labelEl.classList.add('label')
    labelEl.innerText = label
    const valueEl = document.createElement('span')
    valueEl.classList.add('value')
    valueEl.innerText = value
    item.append(labelEl, valueEl)
    return item
}

function showAircraft(data, index){
    const card = document.createElement('div')
    card.classList.add('card')
    
    card.append(createImageBox(data.url_photo))
    card.append(createItem('Регистрация', data.registration))
    card.append(createItem('Тип', data.type))
    card.append(createItem('Производитель', data.manufacturer))
    card.append(createItem('Владелец', data.registered_owner))
    
    const detailsBtn = document.createElement('button')
    detailsBtn.innerText = 'Подробнее'
    detailsBtn.addEventListener('click', () => showDetail(index))
    card.append(detailsBtn)
    
    result.append(card)
}

function showDetail(index){
    const aircraft = loadedAircrafts[index]
    result.innerText = ''
    
    const card = document.createElement('div')
    card.classList.add('card', 'detail-card')
    
    card.append(createImageBox(aircraft.url_photo))
    card.append(createItem('Регистрация', aircraft.registration))
    card.append(createItem('Mode S', aircraft.mode_s))
    card.append(createItem('Тип', aircraft.type))
    card.append(createItem('Производитель', aircraft.manufacturer))
    card.append(createItem('Владелец', aircraft.registered_owner))
    card.append(createItem('Страна', aircraft.registered_owner_country_name))
    
    const coordsSection = document.createElement('div')
    coordsSection.className = 'coords-loading'
    coordsSection.innerText = 'Загрузка координат маршрута'
    card.append(coordsSection)
    
    const backBtn = document.createElement('button')
    backBtn.innerText = 'Назад к списку'
    backBtn.addEventListener('click', showList)
    card.append(backBtn)
    
    result.append(card)
    
    fetch('https://api.adsbdb.com/v0/callsign/random')
        .then(r => r.json())
        .then(data =>{
            coordsSection.innerText = ''
            coordsSection.classList.add('coords')
            
            if(data.response && data.response.flightroute){
                const route = data.response.flightroute
                const origin = route.origin
                const destination = route.destination
                
                const originCoords = (origin.latitude && origin.longitude) 
                const destCoords = (destination.latitude && destination.longitude)
                
                coordsSection.append(createItem('Аэропорт отправления', origin.name))
                coordsSection.append(createItem('Координаты отправления', originCoords))
                coordsSection.append(createItem('Аэропорт прибытия', destination.name))
                coordsSection.append(createItem('Координаты прибытия', destCoords))
                
                mapLayers.forEach(layer => map.removeLayer(layer))
                mapLayers = []
                
                if(origin.latitude && destination.latitude){
                    const originCoords = [origin.latitude, origin.longitude]
                    const destinationCoords = [destination.latitude, destination.longitude]
                    
                    const originMarker = L.marker(originCoords)
                        .bindPopup(`Отправление: ${origin.name}`).addTo(map)
                    
                    const destinationMarker = L.marker(destinationCoords)
                        .bindPopup(`Прибытие: ${destination.name}`).addTo(map)
                    
                    const routeLine = L.polyline([originCoords, destinationCoords], {
                        className: 'flight-route-line'
                    }).addTo(map)
                    
                    mapLayers.push(originMarker, destinationMarker, routeLine)
                }
            }else{
                coordsSection.innerText = 'нет данных о маршруте'
            }
        })
        .catch(() =>{
            coordsSection.innerText = 'Ошибка загрузки координат'
        })
}

function showList(){
    result.innerText = ''
    loadedAircrafts.forEach((aircraft, idx) => showAircraft(aircraft, idx))
}

function loadAircraft(){
    let count = parseInt(countInput.value) || 1
    if(count > 15) count = 15
    if(count < 1) count = 1
    loadedAircrafts = []
    
    mapLayers.forEach(layer => map.removeLayer(layer))
    mapLayers = []
    
    let loadedCount = 0
    
    for(let i = 0; i < count; i++){
        fetch('https://api.adsbdb.com/v0/aircraft/random')
            .then(r => r.json())
            .then(data =>{
                if(data.response && data.response.aircraft){
                    const aircraft = data.response.aircraft
                    loadedAircrafts.push(aircraft)
                    showAircraft(aircraft, loadedAircrafts.length)
                }
                loadedCount++
                checkIfDone()
            })
    }}


btn.addEventListener('click', loadAircraft)
loadAircraft()
