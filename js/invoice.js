// ======== NIP SERVICE (wersja JS) ========

const NIPService = {
    async getCompanyData(nip) {
        nip = nip.replace(/\D/g, "");

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
                    return {
                        nazwa: s.name ?? "",
                        adres: s.workingAddress ?? "",
                        status: s.statusVat ?? ""
                    };
                }
            }
        } catch (e) {
            console.log("Błąd API MF:", e);
        }

        // 2. API NIP24
        try {
            let res = await fetch(`https://api-visual.nip24.pl/v1/company?nip=${nip}`);
            if (res.status === 200) {
                let data = await res.json();

                return {
                    nazwa: data.name ?? "",
                    adres: `${data.address?.street ?? ""} ${data.address?.buildingNumber ?? ""}, ${data.address?.postalCode ?? ""} ${data.address?.city ?? ""}`,
                    status: "active"
                };
            }
        } catch (e) {
            console.log("Błąd API NIP24:", e);
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
        return checksum === parseInt(nip[9]);
    }
};

// ======== AUTOMATYCZNE UZUPEŁNIANIE FORMULARZA ========

document.addEventListener("DOMContentLoaded", () => {
    const nipInput = document.querySelector("#nip");
    if (!nipInput) return;

    nipInput.addEventListener("input", async () => {
        let nip = nipInput.value.replace(/\D/g, "");

        if (nip.length === 10 && NIPService.validateNIP(nip)) {
            console.log("Pobieram dane firmy...");

            let data = await NIPService.getCompanyData(nip);

            if (data) {
                let nameField = document.querySelector("#company_name");
                let addressField = document.querySelector("#company_address");

                if (nameField) nameField.value = data.nazwa || "";
                if (addressField) addressField.value = data.adres || "";
            }
        }
    });
});
