const socket = io();

// Elements 
const $messageForm = document.querySelector('#messageForm');
const $messageFormInput = document.querySelector('#messageInput');
const $messageFormButton = document.querySelector('#messageButton');
const $sendLocationButton = document.querySelector('#sendLocation');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#messageTemplate').innerHTML;
const locationMessageTemplate = document.querySelector('#locationMessageTemplate').innerHTML;
const sidebarTemplate = document.querySelector('#sidebarTemplate').innerHTML;

// Options
const { username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild;

    // Height of last message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Vissible height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    // How far were I scrolled ?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', location => {
    const html = Mustache.render(locationMessageTemplate, {
        username: location.username,
        url: location.url,
        createdAt: moment(location.createdAt).format('h:m a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
});

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    $messageFormButton.setAttribute('disabled', 'disabled');

    socket.emit('sendMessage', e.target.elements.message.value, (error) => {
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if(error) return console.log(error);

        console.log('Message delivered.');
    });
});

$sendLocationButton.addEventListener('click', (e) => {
    e.preventDefault();

    $sendLocationButton.setAttribute('disabled', 'disabled');

    if(!navigator.geolocation) return alert('Geolocation is not supported by your browser.');

    navigator.geolocation.getCurrentPosition((position) => {
        const data = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        };
        socket.emit('sendLocation', data, () => {
            $sendLocationButton.removeAttribute('disabled');
            console.log('Location shared!');
        });
    });
});

socket.emit('join', { username, room}, (error) => {
    if(error) {
        alert(error);
        location.href = '/';
    }
});