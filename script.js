const body = document.body
let map
let mapLayers = []
let loadedAircrafts = []

let savedLogin = ''
let savedPassword = ''

const loginForm = document.createElement('form')

const loginDiv = document.createElement('div')
const loginLabel = document.createElement('label')
loginLabel.innerText = 'Логин: '
const loginInput = document.createElement('input')
loginInput.type = 'text'
loginInput.name = 'login'
loginLabel.append(loginInput)
loginDiv.append(loginLabel)

const passDiv = document.createElement('div')
const passLabel = document.createElement('label')
passLabel.innerText = 'Пароль: '
const passInput = document.createElement('input')
passInput.type = 'password'
passInput.name = 'password'
passLabel.append(passInput)
passDiv.append(passLabel)

const submitBtn = document.createElement('button')
submitBtn.type = 'submit'
submitBtn.innerText = 'Войти'

loginForm.append(loginDiv, passDiv, submitBtn)

const logOutbtn = document.createElement('button')
logOutbtn.innerText = 'Выйти'
logOutbtn.style.marginTop = '20px'
logOutbtn.addEventListener('click', logOut)

loginForm.addEventListener('submit', (e) =>{
    e.preventDefault()
    
    savedLogin = loginInput.value
    savedPassword = passInput.value
    
    localStorage.setItem('login', savedLogin)
    localStorage.setItem('password', savedPassword)
    
    init()
    loginForm.remove()
})

const mainContainer = document.createElement('div')
mainContainer.classList.add('main-container')

const header = document.createElement('div')
header.classList.add('header')
header.innerText = 'AIRCRAFT'

const leftPanel = document.createElement('div')
leftPanel.classList.add('left-panel')

const rightPanel = document.createElement('div')
rightPanel.classList.add('right-panel')

const controls = document.createElement('div')
controls.classList.add('controls')

const countInput = document.createElement('input')
countInput.type = 'number'
countInput.classList.add('count-input')
countInput.value = 1
countInput.min = 1
countInput.max = 15

const btn = document.createElement('button')
btn.innerText = 'Показать самолёты'

const btn5 = document.createElement('button')
btn5.classList.add('btn-preset')
btn5.innerText = '5 карточек'

const btn10 = document.createElement('button')
btn10.classList.add('btn-preset')
btn10.innerText = '10 карточек'

const btn15 = document.createElement('button')
btn15.classList.add('btn-preset')
btn15.innerText = '15 карточек'

btn5.addEventListener('click', () =>{ countInput.value = 5; loadAircraft() })
btn10.addEventListener('click', () =>{ countInput.value = 10; loadAircraft() })
btn15.addEventListener('click', () =>{ countInput.value = 15; loadAircraft() })

controls.append(countInput, btn, btn5, btn10, btn15)
leftPanel.append(controls)

const result = document.createElement('div')
result.id = 'result'
leftPanel.append(result)

const weathercard = document.createElement('div')
weathercard.classList.add('weather')

function createIcon(){
    const img = document.createElement('img')
    img.src = 'plane.svg'
    img.alt = 'Самолёт'
    img.classList.add('icon')
    return img
}

function createImageBox(url){
    const box = document.createElement('div')
    box.classList.add('image-box')
    if (url){
        const img = document.createElement('img')
        img.src = url
        img.onerror = function(){
            this.style.display = 'none'
            box.append(createIcon())
        }
        box.append(img)
    } else{
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
    valueEl.innerText = value || 'Нет данных'
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

function renderRoute(route, container){
    const origin = route.origin
    const destination = route.destination
    
    container.append(createItem('Аэропорт отправления', origin.name))
    if (origin.latitude && origin.longitude){
        container.append(createItem('Координаты отправления', `${origin.latitude}, ${origin.longitude}`))
    }
    
    container.append(createItem('Аэропорт прибытия', destination.name))
    if (destination.latitude && destination.longitude){
        container.append(createItem('Координаты прибытия', `${destination.latitude}, ${destination.longitude}`))
    }

    if (map){
        mapLayers.forEach(layer => map.removeLayer(layer))
        mapLayers = []
        
        if (origin.latitude && origin.longitude && destination.latitude && destination.longitude){
            const originCoords = [origin.latitude, origin.longitude]
            const destCoords = [destination.latitude, destination.longitude]
            
            const originMarker = L.marker(originCoords)
                .bindPopup(`Отправление: ${origin.name}`).addTo(map)
            
            const destinationMarker = L.marker(destCoords)
                .bindPopup(`Прибытие: ${destination.name}`).addTo(map)
            
            const routeLine = L.polyline([originCoords, destCoords]).addTo(map)      
            
            mapLayers.push(originMarker, destinationMarker, routeLine)
            map.fitBounds(routeLine.getBounds())
        }
    }
}

function showDetail(index){
    const aircraft = loadedAircrafts[index]
    
    if (!aircraft){
        result.innerText = "данные не найдены"
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
    coordsSection.classList.add('coords')
    
    if (aircraft.cachedRoute){
        renderRoute(aircraft.cachedRoute, coordsSection)
        
        if (aircraft.cachedRoute.destination && aircraft.cachedRoute.destination.municipality){
            loadWeather(aircraft.cachedRoute.destination.municipality)
        }
    } else{
        coordsSection.innerText = 'нет данных о маршруте'
    }
    
    card.append(coordsSection)
    
    const backBtn = document.createElement('button')
    backBtn.innerText = 'Назад к списку'
    backBtn.addEventListener('click', showList)
    card.append(backBtn)

    result.append(card)
}

function showList(){
    result.innerText = ''
    loadedAircrafts.forEach((aircraft, idx) => showAircraft(aircraft, idx))
    if (map){
        map.flyTo([31.505, 14.09], 2)
        mapLayers.forEach(layer => map.removeLayer(layer)) 
        mapLayers = []
    }
}

function loadAircraft(){
    let count = parseInt(countInput.value)
    if (count > 15) count = 15
    if (count < 1) count = 1
    
    loadedAircrafts = []
    result.innerText = ''
    
    if (map){
        mapLayers.forEach(layer => map.removeLayer(layer))
        mapLayers = []
    }
    
    for (let i = 0; i < count; i++){
        fetch('https://api.adsbdb.com/v0/callsign/random')
            .then(r => r.json())
            .then(routeData =>{
                if (routeData.response && routeData.response.flightroute){
                    const route = routeData.response.flightroute
                    
                    fetch('https://api.adsbdb.com/v0/aircraft/random')
                        .then(r => r.json())
                        .then(acData =>{
                            if (acData.response && acData.response.aircraft){
                                const aircraft = acData.response.aircraft
                                aircraft.callsign = route.callsign
                                aircraft.cachedRoute = route
                                
                                loadedAircrafts.push(aircraft)
                                showAircraft(aircraft, loadedAircrafts.length - 1)
                                
                                if (result.innerText === 'Загрузка...'){
                                    result.innerText = ''
                                }
                            }
                        })
                }
            })
    }
}

const weatherKey = 'c538a72845d03c96bc5536da5502ed1d'

function loadWeather(city = 'Minsk'){
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${weatherKey}`)
        .then(r => r.json())
        .then(data =>{
            const temp = data.main.temp
            const wind = data.wind.speed
            const hum = data.main.humidity
            weathercard.innerText = `Погода ${city}: 
            ${temp ? 'Температура ' + temp + '°C' : ''} 
            ${wind ? 'Скорость ветра ' + wind + ' м/с' : ''} 
            ${hum ? 'Влажность ' + hum + '%' : ''}`
        })
        .catch(() =>{
            weathercard.innerText = 'Ошибка загрузки погоды'
        })
}

function init(){
    body.prepend(header)
    body.append(mainContainer)
    mainContainer.prepend(weathercard)
    mainContainer.append(leftPanel)
    mainContainer.append(rightPanel)

    leftPanel.append(logOutbtn)

    const mapContainer = document.createElement('div')
    mapContainer.id = 'map'
    rightPanel.append(mapContainer)

    map = L.map('map',{ attributionControl: false }).setView([31.505, 14.09], 2)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

    btn.addEventListener('click', loadAircraft)
    loadAircraft()
    loadWeather()
}

function logOut(){
    if (map){
        map.remove()
        map = null
    }
    mapLayers = []
    loadedAircrafts = []
    
    mainContainer.remove()
    header.remove()
    weathercard.remove()
    
    localStorage.clear()
    body.append(loginForm)
}

if (localStorage.getItem('login') && localStorage.getItem('password')){
    savedLogin = localStorage.getItem('login')
    savedPassword = localStorage.getItem('password')
    init()
} else{
    body.append(loginForm)
}
