import { MODAL } from "../classes/Modal.js";
import { Card } from "../classes/Card.js";
import { VisitCardiologist } from "../classes/VisitCardiologist.js";
import { VisitDentist } from "../classes/VisitDentist.js";
import { VisitTherapist } from "../classes/VisitTherapist.js";
import { mainObject } from "./dataObject.js";
import { GetToken, GetAllCards } from "./fetchData.js";
import { renderFilteredCards } from "../components/header/index.js";


export const isWebp = () => {

    const testWebP = (callback) => {
        const webP = new Image();
        webP.onload = webP.onerror = () => {
            callback(webP.height == 2);
        };
        webP.src = "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
    }

    testWebP((support) => {
        const className = support === true ? 'webp' : 'no-webp';
        document.documentElement.classList.add(className);
    });
}


const loginBtn = document.body.querySelector('.btn__login');
const visitBtn = document.body.querySelector('.btn__visit');
const logOutBtn = document.body.querySelector('.btn__logout');
const modalWrapper = document.body.querySelector('.modal');
loginBtn.addEventListener('click', () => createLoginForm(modalWrapper));
visitBtn.addEventListener('click', () => createVisitForm(modalWrapper));
logOutBtn.addEventListener('click', () => closeSession());


function createLoginForm(form) {
    const modal = new MODAL(form);
    modal.showLoginForm();
    const btn = form.querySelector('button[type="submit"]');
    btn.addEventListener('click', (e) => submitLogin(e, form));
}


async function submitLogin(e, form) {
    e.preventDefault();
    const email = form.querySelector('input[name="username"]').value;
    const password = form.querySelector('input[name="password"]').value;

    const token = await GetToken(email, password);
    if (!!token) {
        form.innerHTML = '';
        form.classList.add('modal--hide');
        sessionStorage.clear();
        sessionStorage.token = JSON.stringify(token);
        loadUserCardsFromServer();
        openUserSession();
    }
}


function openUserSession() {
    visitBtn.classList.remove('hide');
    logOutBtn.classList.remove('hide');
    loginBtn.classList.add('hide');
}

function closeSession() {
    const cardWrapper = document.body.querySelector('.cards__content');
    logOutBtn.classList.add('hide');
    visitBtn.classList.add('hide');
    loginBtn.classList.remove('hide');
    sessionStorage.clear();
    cardWrapper.innerHTML = '';
    checkContent();
}


(function checkLoginSession() {
    sessionStorage.getItem('token') && openUserSession(loginBtn, visitBtn);
})()


function createVisitForm(modalWrapper) {
    const modal = new MODAL(modalWrapper);
    modal.showDefaultVisit();
    const doctorInput = modalWrapper.querySelector('#select-doctor');
    const form = modalWrapper.querySelector('.form-visit');

    doctorInput.addEventListener('input', () => {
        modal.showSpecificFields(doctorInput.value);
    });
    form.addEventListener('submit', (e) => postVisitData(doctorInput.value, modal.createVisitParams(e), modalWrapper));
}


async function postVisitData(doctor, props, form) {
    let newDoctor;
    if (doctor === "cardiologist") newDoctor = new VisitCardiologist(props);
    if (doctor === "dentist") newDoctor = new VisitDentist(props);
    if (doctor === "therapist") newDoctor = new VisitTherapist(props);

    const newVisitData = await newDoctor.visit();
    if (!!newVisitData) {
        mainObject.data.push(newVisitData);
        mainObject.sortNow();
        form.innerHTML = '';
        form.classList.add('modal--hide');
        renderFilteredCards();
        checkContent();
    }
}


!!sessionStorage.getItem('token') ? loadUserCardsFromServer() : checkContent();


export async function loadUserCardsFromServer() {
    const data = await GetAllCards();
    mainObject.data = [...data];
    mainObject.sortNow();
    renderFilteredCards();
    checkContent();
}


export function renderCards(cards) {

    cards.forEach((cardData, i) => {
        setTimeout(() => {
            const item = new Card(cardData);
            item.render();
        }, 100 * i)
    })
}


export function checkContent() {
    const noContent = document.body.querySelector('.no-content');
    const searchBtns = document.body.querySelectorAll('button[name*="search"]');
    setTimeout(() => {
        if (!sessionStorage.getItem('token')) {
            noContent.innerHTML = 'You are not authorized';
            noContent.classList.remove('no-content--hide');
            searchBtns.forEach(btn => btn.setAttribute('disabled', true));
        } else if (!mainObject.data.length) {
            noContent.innerHTML = 'No items have been added';
            noContent.classList.remove('no-content--hide');
        } else {
            noContent.classList.add('no-content--hide');
            searchBtns.forEach(btn => btn.removeAttribute('disabled'));
        }
    })
}


export function createEditModal(cardData) {
    const modalWrapper = document.body.querySelector('.modal');
    const modal = new MODAL(modalWrapper);
    const cardInfo = cardData;
    modal.showEditModal(cardInfo);
    const btn = modalWrapper.querySelector('button.submit');
    btn.setAttribute('disabled', true);
    btn.textContent = 'Save Changes';
    const form = modalWrapper.querySelector('.form-visit');

    form.addEventListener('submit', (e) => {
        const cardChanges = modal.createVisitParams(e);
        const newCardInfo = { ...cardInfo, ...cardChanges };
        cardData.saveChangesOnServer(newCardInfo);
        modalWrapper.innerHTML = '';
        modalWrapper.classList.add('modal--hide');
    });
}