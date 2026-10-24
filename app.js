// Firebase Yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyDWCM6kkyW1uhMVdYaYQEzfNZM6GM9tmUY",
  authDomain: "fetih-social.firebaseapp.com",
  databaseURL: "https://fetih-social-default-rtdb.firebaseio.com",
  projectId: "fetih-social",
  storageBucket: "fetih-social.firebasestorage.app",
  messagingSenderId: "787128595926",
  appId: "1:787128595926:web:c81ddfd9c3b3989536a077",
  measurementId: "G-2LDX8H85H9"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const auth = firebase.auth();

// Form Geçiş Fonksiyonları (Doğrudan HTML Tarafından Çağrılır)
function openRegister() {
    document.getElementById('loginFormSection').style.display = 'none';
    document.getElementById('registerFormSection').style.display = 'block';
}

function openLogin() {
    document.getElementById('registerFormSection').style.display = 'none';
    document.getElementById('loginFormSection').style.display = 'block';
}

// KAYIT OLMA İŞLEMİ
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const phone = document.getElementById('regPhone').value;
            const grade = document.getElementById('regGrade').value;
            const password = document.getElementById('regPassword').value;

            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const user = userCredential.user;

                    return db.ref('users/' + user.uid).set({
                        isim: name,
                        eposta: email,
                        telefon: phone,
                        sinif: grade,
                        kayitTarihi: new Date().toISOString()
                    });
                })
                .then(() => {
                    alert("Kayıt başarıyla oluşturuldu! Giriş yapabilirsiniz.");
                    registerForm.reset();
                    openLogin();
                })
                .catch((error) => {
                    alert("Kayıt Hatası: " + error.message);
                });
        });
    }

    // GİRİŞ YAPMA İŞLEMİ
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    alert("Başarıyla giriş yapıldı! YKS Takip Paneline Hoş Geldiniz.");
                })
                .catch((error) => {
                    alert("Giriş Hatası: E-posta veya şifre hatalı!");
                });
        });
    }
});

