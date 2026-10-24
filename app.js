// Firebase Yapılandırması
const firebaseConfig = {
    databaseURL: "https://fetih-social-default-rtdb.firebaseio.com/"
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
