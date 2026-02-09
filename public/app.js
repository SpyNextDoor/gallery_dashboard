// ----------------------
// Firebase v9 Modular Imports
// ----------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js";

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// ----------------------
// Firebase Config
// ----------------------
const firebaseConfig = {
  apiKey: "AIzaSyB820a1eL5d3KHphqmLtx_qSRD59Zp8ues",
  authDomain: "virtual-art-gallery-56498.firebaseapp.com",
  databaseURL: "https://virtual-art-gallery-56498-default-rtdb.firebaseio.com",
  projectId: "virtual-art-gallery-56498",
  storageBucket: "virtual-art-gallery-56498.firebasestorage.app",
  messagingSenderId: "194916913627",
  appId: "1:194916913627:web:b9049dbba1d28bdc3b17fe",
  measurementId: "G-WZYN4QPXMW"
};

// ----------------------
// Initialize Firebase
// ----------------------
const app = initializeApp(firebaseConfig);
getAnalytics(app);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// ----------------------
// DOM Elements
// ----------------------
const loginDiv = document.getElementById("login");
const dashboardDiv = document.getElementById("dashboard");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const addArtworkBtn = document.getElementById("addArtworkBtn");

const titleInput = document.getElementById("title");
const artistNameInput = document.getElementById("artistName");
const priceInput = document.getElementById("price");
const artistWebsiteInput = document.getElementById("artistWebsite");
const descriptionInput = document.getElementById("description");
const imageFileInput = document.getElementById("imageFile");
const videoFileInput = document.getElementById("videoFile");
const artworkListDiv = document.getElementById("artworkList");

// 🔐 Allowed email
const ALLOWED_EMAIL = "jnn004@bucknell.edu";

// ----------------------
// Auth & UI
// ----------------------
loginBtn.addEventListener("click", () => {
  signInWithPopup(auth, provider).catch(err => alert(err.message));
});

logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => location.reload());
});

onAuthStateChanged(auth, user => {
  if (!user) return;

  if (user.email !== ALLOWED_EMAIL) {
    alert("Access denied.");
    signOut(auth);
    return;
  }

  loginDiv.classList.add("hidden");
  dashboardDiv.classList.remove("hidden");
  loadArtworks();
});

// ----------------------
// Upload file helper
// ----------------------
async function uploadFile(file, path) {
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

// ----------------------
// Add Artwork
// ----------------------
addArtworkBtn.addEventListener("click", async () => {
  try {
    const artworkRef = doc(collection(db, "artworks"));
    const id = artworkRef.id;

    const image = imageFileInput.files[0];
    if (!image) return alert("Please select an image.");

    const video = videoFileInput.files[0];

    const imageUrl = await uploadFile(image, `artworks/${id}/image.png`);
    const videoUrl = video ? await uploadFile(video, `artworks/${id}/video.mp4`) : "";

    await setDoc(artworkRef, {
      title: titleInput.value,
      artistName: artistNameInput.value,
      description: descriptionInput.value,
      price: Number(priceInput.value),
      artistWebsite: artistWebsiteInput.value,
      imageUrl,
      videoUrl,
      isVisible: true,
      createdAt: serverTimestamp()
    });

    alert("Artwork added!");

    // Clear inputs
    titleInput.value = "";
    artistNameInput.value = "";
    priceInput.value = "";
    artistWebsiteInput.value = "";
    descriptionInput.value = "";
    imageFileInput.value = "";
    videoFileInput.value = "";

  } catch (err) {
    console.error(err);
    alert("Error adding artwork.");
  }
});

// ----------------------
// Load Artworks
// ----------------------
function loadArtworks() {
  const q = query(collection(db, "artworks"), orderBy("createdAt", "desc"));
  onSnapshot(q, snapshot => {
    artworkListDiv.innerHTML = "";

    snapshot.forEach(docSnap => {
      const art = docSnap.data();

      const card = document.createElement("div");
      card.className = "card bg-base-200 p-4";

      card.innerHTML = `
        <div class="flex justify-between items-center">
          <div>
            <h3 class="font-bold">${art.title}</h3>
            <p class="text-sm">${art.artistName}</p>
            <p class="text-sm">$${art.price}</p>
          </div>
          <button class="btn btn-sm ${art.isVisible ? "btn-warning" : "btn-success"}">
            ${art.isVisible ? "Hide" : "Show"}
          </button>
        </div>
      `;

      // Handle toggle visibility without inline onclick
      const btn = card.querySelector("button");
      btn.addEventListener("click", () => toggleVisibility(docSnap.id, art.isVisible));

      artworkListDiv.appendChild(card);
    });
  });
}

// ----------------------
// Toggle Visibility
// ----------------------
async function toggleVisibility(id, visible) {
  const artRef = doc(db, "artworks", id);
  await updateDoc(artRef, { isVisible: !visible });
}
