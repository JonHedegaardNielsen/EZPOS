var productDB = new PouchDB('ProductList')

const purchasesTable = document.getElementById("puchasesTable")
const vBox = document.getElementById("VBox")




document.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("loginBtn").click();
    }
});

/*--------------------------------------*/ 
function getCouchDBName(username)
{
    return "userdb-657a706f73"

    let encoded = new Buffer(username).toString('hex');    
    return "userdb-"+encoded
}
var username = "ezpos";
var password = "Test123";
var dbname = getCouchDBName(username);

async function login() {
    var response = await fetch("https://sofa.hoxer.net/_session", {
        method : "POST",
        headers: {
            "Content-Type" : "application/json"
        },
        body : JSON.stringify({"name" : username, "password" : password})
    })
    console.log(response)
}
login();

const db = new PouchDB(`sofa.hoxer.net/${dbname}`)
/*--------------------------------------*/ 

document.getElementById("loginBtn").addEventListener("click", function () {
    const enteredUsername = document.getElementById("username").value;
    const enteredPassword = document.getElementById("password").value;

    if (enteredUsername === userName && enteredPassword === userPassword) {
        loadProducts(); 
        document.getElementById("loadButtons").style.display = "block"; 
    } else {
        errorMessage.style.display = "block";
    }
});

function loadProducts() {
    console.log("Loading products...");
}



function formatDate(date) {
    return date.toLocaleDateString('da-eu')
}


function loadProducts() {
    stopDisplayingData()
    document.getElementById("PBox").style.display = "none";
    productsDiv.style.display = "contents";
    document.getElementById("AddBtn").style.display = "contents";
}

function stopDisplayingData() {
    purchasesTable.style.display = "none"
    productsDiv.style.display = "none"
    mostPuchasedTable.style.display = "none"
}

async function loadPurchases() {
    purchasesTable.innerHTML = `
        <tr>
            <th>Name</th>
            <th>Amount</th>
            <th>Price</th>
            <th>Date</th>
        </tr>`

    stopDisplayingData()

    purchasesTable.style.display = "contents"

    const doc = await productDB.get("purchase")

    const purchases = doc.purchases || [];


    purchases.forEach((purchase) => {
        const newGroup = document.createElement('tr');

        const groupId = `group-${Date.now()}`;
        newGroup.setAttribute('data-id', groupId);

        newGroup.innerHTML = `
            <td>${purchase.Name}</td>
            <td>${purchase.Amount}</td>
            <td>${purchase.Price}</td>
            <td>${purchase.Date}</td>
        `;

        purchasesTable.appendChild(newGroup);
    })
}

async function addProduct() {
    const newGroup = document.createElement('div');
    newGroup.classList.add('group');

    const groupId = `group-${Date.now()}`;
    newGroup.setAttribute('data-id', groupId);

    newGroup.innerHTML = `
        <select class="CustomBox" name="category">
            <option value="" disabled selected>Select a category</option>
            <option value="Food">Food</option>
            <option value="Beverage">Beverage</option>
            <option value="Drink">Drink</option>
            <option value="Goody">Goody</option>
            <option value="Misc">Misc</option>
        </select>
        <input type="text" minlength="2" placeholder="Name" class="group-input">
        <input type="number" name="price" min="1" placeholder="Price" class="group-input">
        <input type="number" name="amount" min="1" placeholder="Amount" class="group-input">
        <input type="checkbox" name="isHidden">
        <label class="hidden"> Hidden</label><br>
        <button class="RemoveButton">Remove</button>
    `;

    vBox.appendChild(newGroup);

    newGroup.querySelector('.RemoveButton').addEventListener('click', function () {
        removeProduct(newGroup);
    });
}

async function saveProduct() {
    let doc = null;

    try {
        doc = await productDB.get('product');
    } catch (e) {
        console.log("Could not fetch the Products document");
        doc = {
            _id: "product",
            products: []
        };
    }

    vBox.querySelectorAll('.group').forEach(group => {
        const category = group.querySelector('select[name="category"]').value;
        const itemName = group.querySelector('input[type="text"]').value.trim();
        const itemPrice = group.querySelector('input[name="price"]').value;
        const itemAmount = group.querySelector('input[name="amount"]').value;
        const isHidden = group.querySelector('input[name="isHidden"]').checked;

        if (itemName && itemPrice && itemAmount) {
            const index = Array.from(vBox.children).indexOf(group);
            if (index !== -1) {
                doc.products[index] = {
                    "Category": category,
                    "Name": itemName,
                    "Price": itemPrice,
                    "Amount": itemAmount,
                    "Hidden": isHidden
                };
            }
        }
    });

    console.log("Loaded revision " + doc._rev);

    try {
        const result = await productDB.put(doc);
        console.log("Products saved successfully with revision: " + result.rev);
    } catch (e) {
        console.error("Error saving document:", e);
    }
}

async function retrieveAndDisplayProducts() {
    try {
        const doc = await productDB.get('product');
        const products = doc.products || [];

        const container = document.getElementById('VBox');
        container.innerHTML = '';

        products.forEach((product, index) => {
            const newGroup = document.createElement('div');
            newGroup.classList.add('group');

            newGroup.innerHTML = `
                <select name="category">
                    <option value="" disabled>Select a category</option>
                    <option value="Food" ${product.Category === "Food" ? "selected" : ""}>Food</option>
                    <option value="Beverage" ${product.Category === "Beverage" ? "selected" : ""}>Beverage</option>
                    <option value="Drink" ${product.Category === "Drink" ? "selected" : ""}>Drink</option>
                    <option value="Goody" ${product.Category === "Goody" ? "selected" : ""}>Goody</option>
                    <option value="Misc" ${product.Category === "Misc" ? "selected" : ""}>Misc</option>
                </select>
                <input type="text" minlength="2" placeholder="Name" class="group-input" value="${product.Name}">
                <input type="number" name="price" min="1" placeholder="Price" class="group-input" value="${product.Price}">
                <input type="number" name="amount" min="1" placeholder="Amount" class="group-input" value="${product.Amount}">
                <input type="checkbox" class="group-box" name="isHidden" ${product.Hidden ? "checked" : ""}>
                <label class="hidden"> Hidden</label>
                <button class="RemoveButton">Remove</button>
            `;

            container.appendChild(newGroup);

            newGroup.querySelector('.RemoveButton').addEventListener('click', function () {
                removeProduct(newGroup);
            });
        });

    } catch (e) {
        console.error("Error retrieving the document:", e);
    }
}

async function loadMostSold() {
    const purchasesAmounts = []
    mostPuchasedTable.innerHTML = `
        <tr>
            <th>Number</th>
            <th>Most Purchased</th>
            <th>Most Money Made</th>
        </tr>
    `
    const doc = await productDB.get("purchase")

    const purchases = doc.purchases || [];

    purchases.forEach((purchase) => {
        const foundpurchase = purchasesAmounts.find(p => p.Name === purchase.Name)

        if (foundpurchase) {
            foundpurchase.Amount += purchase.Amount
            foundpurchase.Price = foundpurchase.Price + purchase.Price
        } else {
            purchasesAmounts.push({
                Name: purchase.Name,
                Amount : purchase.Amount,
                Price : purchase.Price
            })
        }

        window.onload = retrieveAndDisplayProducts;

    })

    stopDisplayingData()
    mostPuchasedTable.style.display = "contents"

    const amountsSorted = purchasesAmounts.slice().sort((a, b) => b.Amount - a.Amount)
    const incomeSorted = purchasesAmounts.slice().sort((a, b) => b.Price - a.Price)

    for (i = 0; amountsSorted.length > i; i++) {
        const group = document.createElement("tr")
        group.innerHTML = `
            <td>${i + 1}</td>
            <td>${amountsSorted[i].Name}</td>
            <td>${incomeSorted[i].Name}</td>
        `

        mostPuchasedTable.appendChild(group)
    }
}


async function removeProduct(productGroup) {
    try {
        const doc = await productDB.get('product');
        const container = document.getElementById('VBox');
        const index = Array.from(container.children).indexOf(productGroup);

        if (index !== -1) {
            doc.products.splice(index, 1);

            await productDB.put(doc);
            console.log('Product removed successfully');

            productGroup.remove();
        }
    } catch (error) {
        console.error('Error removing product:', error);
    }
}


window.onload = retrieveAndDisplayProducts;
