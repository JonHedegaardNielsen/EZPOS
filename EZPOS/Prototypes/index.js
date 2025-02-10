const pickedItems = document.getElementById("pickedItems")
let totalPrice = 0
let selectedPickedItemDivs = []
let pickedItemsNames = new Set()
const totalCostSpan = document.getElementById("totalCostText")
var productDB = new PouchDB('ProductList')
var username = "ezpos";
var password = "Test123";

function getCouchDBName(username)
{
    return "userdb-657a706f73"

    let encoded = new Buffer(username).toString('hex');    
    return "userdb-"+encoded
}

var dbname = getCouchDBName(username);
var url = `https://${username}:${password}@sofa.hoxer.net/${dbname}`
console.log(url)
const db = new PouchDB(`https://${username}:${password}@sofa.hoxer.net/${dbname}`)

document.addEventListener('DOMContentLoaded', async () => {
    async function loadShopItems() {
        try {
            const doc = await productDB.get('product');
            const products = doc.products || [];
            const shopItemsGrid = document.querySelector('.grid.shopItems');

            shopItemsGrid.innerHTML = '';

            products.forEach(product => {
                const { Name, Price, Amount, Category } = product;
                let Hidden = product.Hidden || Amount == 0


                if (Name && Price && !Hidden) {
                    let color;

                    switch (Category) {
                        case "Food":
                            color = "red";
                            break;
                        case "Beverage":
                            color = "darkblue";
                            break;
                        case "Drink":
                            color = "blue";
                            break;
                        case "Goody":
                            color = "green";
                            break;
                        case "Misc":
                            color = "yellow";
                            break;
                        default:
                            color = "";
                            break;
                    }

                    const itemButton = document.createElement('button');
                    itemButton.classList.add("itemButton");

                    itemButton.innerHTML = `
                        <div class="itemButtonColor ${color}">
                            <section class="sectionSplit">
                                <p class="itemName">${Name}</p>
                                <section>
                                    <p class="itemPrice">${Price},-</p>
                                </section>
                                <p class="itemAmount">Antal: ${Amount}</p>
                            </section>
                        </div>
                    `;
                    itemButton.addEventListener("click", () => pickItem(Name, parseFloat(Price)));

                    shopItemsGrid.appendChild(itemButton);
                }
            });
        } catch (error) {
            console.error("Error loading shop items:", error);
        }
    }

    await loadShopItems();
});


function clearPickedItems() {
    pickedItems.innerHTML = ""
    totalPrice = 0
    setTotalPriceText()
    selectedPickedItemDivs = []
    pickedItemsNames.clear()
}

function setTotalPriceText() {
    totalCostSpan.innerHTML = formatPrice(totalPrice)
}

function formatPrice(price) {
    return `${price.toFixed(2).replace(".", ",")} KR.`
}

function pickItem(itemName, itemPrice) {
    const pickedItemDiv = document.createElement("div")
    pickedItemDiv.classList.add("pickedItem")
    const pickedItemCheckBox = document.createElement("input")
    pickedItemCheckBox.setAttribute("type", "checkbox")
    pickedItemCheckBox.classList.add("pickeditemSelectedCheckBox")
    pickedItemCheckBox.addEventListener("click", () => selectPickedItem(pickedItemCheckBox, pickedItemDiv))

    if (pickedItemsNames.has(itemName)) {
        let amount = document.querySelectorAll(".pickedItemName")
        Array.from(amount).forEach((element) => {
            if (element.innerHTML !== itemName) {
                return
            }
            
            const parent = element.parentElement.parentElement
            const itemPriceSpan = parent.querySelector(".pickedItemPrice")
            itemPriceSpan.innerHTML = formatPrice(parseFloat(itemPriceSpan.innerHTML) + itemPrice)
            const itemAmountSpan = parent.querySelector(".itemAmount")
            itemAmountSpan.innerHTML = (parseInt(itemAmountSpan.innerHTML.replace("x")) + 1) + " x"
        })
    }
    else {
        pickedItemDiv.innerHTML += `
            <span class="pickedItemNameAndAmount">
                <span class="itemAmount">1 x</span> 
                <span class="pickedItemName">${itemName}</span>
            </span>
            <span class="pickedItemPrice">${formatPrice(itemPrice)}</span>
        `

        pickedItemDiv.appendChild(pickedItemCheckBox)
        pickedItems.appendChild(pickedItemDiv)
    }
    totalPrice = calculateTotalCost()

    setTotalPriceText()
    pickedItemsNames.add(itemName)
}

function selectPickedItem(checkBox, div) {
    console.log(1)
    div.classList = ""

    if (checkBox.checked) {
        div.classList.add("pickedItem", "selected")
    }
    else {
        div.classList.add("pickedItem")
    }

    selectedPickedItemDivs.push(div)
}

function calculateTotalCost() {
    let cost = 0
    Array.from(document.getElementsByClassName("pickedItemPrice")).forEach((element) => {
        cost += parseFloat(element.innerHTML)
    })
    return cost
}

function deleteSelectedItems() {
    selectedPickedItemDivs.forEach((element) => {
        try {
            pickedItems.removeChild(element)
            pickedItemsNames.delete(element.querySelector(".pickedItemName").innerHTML)
        }
        catch {
            document.getElementsByClassName("pickeditemSelectedCheckBox").checked = false
        }

    })

    pickedItemsNames.delete()
    totalPrice = calculateTotalCost()
    setTotalPriceText()
    selectedPickedItemDivs = []
}

async function aprovePurchase() {
    try {
        let purchaseDoc
        try{
            purchaseDoc = await productDB.get('purchase');
        } catch{
            purchaseDoc = {
                _id: "purchase",
                purchases: []
            };
        }
        

        const purchases = purchaseDoc.purchases || [];

        const doc = await productDB.get('product');
        const products = doc.products || [];
        let isInsertable = true
        pickedItems.querySelectorAll(".pickedItem").forEach(pickedItem => {
            const itemName = pickedItem.querySelector(".pickedItemName").innerHTML;
            const itemAmount = parseInt(pickedItem.querySelector(".itemAmount").innerHTML.replace(" x", ""));
            const itemPrice = pickedItem.querySelector(".pickedItemPrice").innerHTML;


            const product = products.find(product => product.Name === itemName);

            if (product) {
                product.Amount = product.Amount - itemAmount;
                if (product.Amount < 0) {
                    alert("IKKE FLERE: " + product.Name + " PÅ LAGER")
                    isInsertable = false
                }
                else{
                    purchases.push({
                        Name : itemName,
                        Amount : itemAmount,
                        Price : parseFloat(itemPrice),
                        Date : new Date().toLocaleDateString('da-eu')
                    })
                }

            }


        });

        if (isInsertable === true) {
            await productDB.put({ ...doc, products });

            await productDB.put({ ...purchaseDoc, purchases});


            clearPickedItems();

            location.reload();

            console.log("Purchase approved and stock updated.");
        }

    } catch (error) {
        console.error("Error approving purchase:", error);
    }
}
