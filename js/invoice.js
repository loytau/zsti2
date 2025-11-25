// ============================
//  NIP SERVICE – wersja JS
// ============================

const NIPService = {
    async getCompanyData(nip) {
        nip = nip.replace(/\D/g, "");
        console.log("Sprawdzam NIP:", nip);

        // 1. API Ministerstwa Finansów
        try {
            let res = await fetch(
                `https://wl-api.mf.gov.pl/api/search/nip/${nip}?date=2024-01-01`,
                { headers: { "User-Agent": "FinBot/1.0" } }
            );

            if (res.status === 200) {
                let data = await res.json();
                if (data?.result?.subject) {
                    let s = data.result.subject;
                    console.log("Dane z MF:", s);
                    return {
                        nazwa: s.name ?? "",
                        adres: s.workingAddress ?? "",
                        status: s.statusVat ?? ""
                    };
                }
            }
        } catch (e) {
            console.warn("Błąd API MF:", e);
        }

        // 2. API NIP24 (fallback)
        try {
            let res = await fetch(`https://api-visual.nip24.pl/v1/company?nip=${nip}`);
            if (res.status === 200) {
                let data = await res.json();
                console.log("Dane z NIP24:", data);
                return {
                    nazwa: data.name ?? "",
                    adres: `${data.address?.street ?? ""} ${data.address?.buildingNumber ?? ""}, ${data.address?.postalCode ?? ""} ${data.address?.city ?? ""}`,
                    status: "active"
                };
            }
        } catch (e) {
            console.warn("Błąd API NIP24:", e);
        }

        return null;
    },

    validateNIP(nip) {
        nip = nip.replace(/\D/g, "");
        if (nip.length !== 10) return false;

        const weights = [6,5,7,2,3,4,5,6,7];
        let checksum = 0;

        for (let i = 0; i < 9; i++) {
            checksum += parseInt(nip[i]) * weights[i];
        }

        checksum %= 11;
        const valid = checksum === parseInt(nip[9]);
        if (!valid) console.warn("Niepoprawny NIP:", nip);
        return valid;
    }
};

// ============================
//  AUTO-UZUPEŁNIANIE NIP
// ============================

async function fillBuyerOrSeller(type) {
    const nipField = document.querySelector(`#${type}_nip`);
    const nameField = document.querySelector(`#${type}_company`);
    const streetField = document.querySelector(`#${type}_street`);
    const postalField = document.querySelector(`#${type}_postal`);
    const cityField = document.querySelector(`#${type}_city`);
    console.log("Listener aktywowany dla:", type, "NIP:", nipField.value);


    let nip = nipField.value.replace(/\D/g, "");

    if (nip.length !== 10 || !NIPService.validateNIP(nip)) {
        console.log(`NIP ${nip} nieprawidłowy lub niekompletny.`);
        nameField.value = "";
        streetField.value = "";
        postalField.value = "";
        cityField.value = "";
        return;
    }

    console.log("Pobieram dane firmy dla:", nip);
    let data = await NIPService.getCompanyData(nip);

    if (!data) {
        console.log("Nie udało się pobrać danych dla NIP:", nip);
        return;
    }

    if (data.adres.includes(",")) {
        let parts = data.adres.split(",");
        let street = parts[0].trim();
        let cityPost = parts[1].trim();

        let postal = cityPost.substring(0, 6).trim();
        let city = cityPost.substring(7).trim();

        streetField.value = street || "";
        postalField.value = postal || "";
        cityField.value = city || "";
    } else {
        streetField.value = data.adres || "";
    }

    nameField.value = data.nazwa || "";
}

// ============================
//   LISTENERY
// ============================

document.addEventListener("DOMContentLoaded", () => {
    // Sprzedawca
    const sellerNip = document.querySelector("#seller_nip");
    if (sellerNip) sellerNip.addEventListener("input", () => fillBuyerOrSeller("seller"));

    // Nabywca
    const buyerNip = document.querySelector("#buyer_nip");
    if (buyerNip) buyerNip.addEventListener("input", () => fillBuyerOrSeller("buyer"));

    console.log("Autouzupełnianie NIP aktywne.");
});
