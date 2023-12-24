var uid=null;
AFRAME.registerComponent("markerhandler",{
    init:async function(){

        var toys= await this.getToys();

        if(uid===null){
            this.askUserId();
        }



        this.el.addEventListener("markerFound",() =>{
            if(uid!==null){
                var markerId=this.el.id;
                this.handleMarkerFound(toys,markerId)
            }
        });

        this.el.addEventListener("markerLost",()=>{
            console.log("Marker is lost!");
            this.handleMarkerLost();
        });
    },

    askUserId: function() {
        var iconUrl =
          "https://raw.githubusercontent.com/whitehatjr/ar-toy-store-assets/master/toy-shop.png";
    
        swal({
          title: "Welcome to Toy Shop!!",
          icon: iconUrl,
          content: {
            element: "input",
            attributes: {
              placeholder: "Type your uid Ex:( U01 )"
            }
          },
        }).then(inputValue => {
          uid = inputValue;
        });
    },

    handleMarkerFound: function(toys, markerId) {
        var toy = toys.filter(toy => toy.id === markerId)[0];
    
        if (toy.is_out_of_stock) {
          swal({
            icon: "warning",
            title: toy.toy_name.toUpperCase(),
            text: "This toy is out of stock!!!",
            timer: 2500,
            buttons: false
          });
        } else {
          // Changing Model scale to initial scale
          var model = document.querySelector(`#model-${toy.id}`);
          model.setAttribute("position", toy.model_geometry.position);
          model.setAttribute("rotation", toy.model_geometry.rotation);
          model.setAttribute("scale", toy.model_geometry.scale);
    
          // make model visible
          var model = document.querySelector(`#model-${toy.id}`);
          model.setAttribute("visible", true);
    
          // make mian plane Container visible
          var mainPlane = document.querySelector(`#main-plane-${toy.id}`);
          mainPlane.setAttribute("visible", true);
    
          // Changing button div visibility
          var buttonDiv = document.getElementById("button-div");
          buttonDiv.style.display = "flex";
    
          var orderButtton = document.getElementById("order-button");
          var orderSummaryButtton = document.getElementById("order-summary-button");
          var ratingButton=document.getElementById("rating-button")

          var payButton = document.getElementById("pay-button");

    
          // Handling Click Events
          orderButtton.addEventListener("click", () => {
            uid = uid.toUpperCase();
            this.handleOrder(uid, toy);
    
            swal({
              icon: "https://i.imgur.com/4NZ6uLY.jpg",
              title: "Thanks For Order !",
              text: "  ",
              timer: 2000,
              buttons: false
            });
          });

          orderSummaryButtton.addEventListener("click",()=>{
            this.handleOrderSummary();
          });

          payButton.addEventListener("click",()=>{
            this.handlePayment();
          });

          ratingButton.addEventListener("click",()=>{
            this.handleRatings();
          });
        }
    },
    handleOrder: function(uid, toy) {
        // Reading current UID order details
        firebase
          .firestore()
          .collection("users")
          .doc(uid)
          .get()
          .then(doc => {
            var details = doc.data();
    
            if (details["current_orders"][toy.id]) {
              // Increasing Current Quantity
              details["current_orders"][toy.id]["quantity"] += 1;
    
              //Calculating Subtotal of item
              var currentQuantity = details["current_orders"][toy.id]["quantity"];
    
              details["current_orders"][toy.id]["subtotal"] =
                currentQuantity * toy.price;
            } else {
              details["current_orders"][toy.id] = {
                item: toy.toy_name,
                price: toy.price,
                quantity: 1,
                subtotal: toy.price * 1
              };
            }
    
            details.total_bill += toy.price;
    
            // Updating Db
            firebase
              .firestore()
              .collection("users")
              .doc(doc.id)
              .update(details);
          });
    },
    getToys: async function() {
        return await firebase
          .firestore()
          .collection("toys")
          .get()
          .then(snap => {
            return snap.docs.map(doc => doc.data());
        });
    },

    getOrderSummary: async function (uid) {
        return await firebase
          .firestore()
          .collection("users")
          .doc(uid)
          .get()
          .then(doc => doc.data());
      },

      handleOrderSummary: async function () {

        //Getting Table Number
        var userid;
        uid <= 9 ? (userid = `U0${uid}`) : `U${uid}`;
    
        //Getting Order Summary from database
        var orderSummary = await this.getOrderSummary(uid);
    
        //Changing modal div visibility
        var modalDiv = document.getElementById("modal-div");
        modalDiv.style.display = "flex";
    
        //Get the table element
        var tableBodyTag = document.getElementById("bill-table-body");
    
        //Removing old tr(table row) data
        tableBodyTag.innerHTML = "";
    
        //Get the cuurent_orders key 
        var currentOrders = Object.keys(orderSummary.current_orders);
    
        currentOrders.map(i => {
    
          //Create table row
          var tr = document.createElement("tr");
    
          //Create table cells/columns for ITEM NAME, PRICE, QUANTITY & TOTAL PRICE
          var item = document.createElement("td");
          var price = document.createElement("td");
          var quantity = document.createElement("td");
          var subtotal = document.createElement("td");
    
          //Add HTML content 
          item.innerHTML = orderSummary.current_orders[i].item;
    
          price.innerHTML = "$" + orderSummary.current_orders[i].price;
          price.setAttribute("class", "text-center");
    
          quantity.innerHTML = orderSummary.current_orders[i].quantity;
          quantity.setAttribute("class", "text-center");
    
          subtotal.innerHTML = "$" + orderSummary.current_orders[i].subtotal;
          subtotal.setAttribute("class", "text-center");
    
          //Append cells to the row
          tr.appendChild(item);
          tr.appendChild(price);
          tr.appendChild(quantity);
          tr.appendChild(subtotal);
    
          //Append row to the table
          tableBodyTag.appendChild(tr);
        });
    
        //Create a table row to Total bill
        var totalTr = document.createElement("tr");
    
        //Create a empty cell (for not data)
        var td1 = document.createElement("td");
        td1.setAttribute("class", "no-line");
    
        //Create a empty cell (for not data)
        var td2 = document.createElement("td");
        td1.setAttribute("class", "no-line");
    
        //Create a cell for TOTAL
        var td3 = document.createElement("td");
        td1.setAttribute("class", "no-line text-center");
    
        //Create <strong> element to emphasize the text
        var strongTag = document.createElement("strong");
        strongTag.innerHTML = "Total";
    
        td3.appendChild(strongTag);
    
        //Create cell to show total bill amount
        var td4 = document.createElement("td");
        td1.setAttribute("class", "no-line text-right");
        td4.innerHTML = "$" + orderSummary.total_bill;
    
        //Append cells to the row
        totalTr.appendChild(td1);
        totalTr.appendChild(td2);
        totalTr.appendChild(td3);
        totalTr.appendChild(td4);
    
        //Append the row to the table
        tableBodyTag.appendChild(totalTr);
      },
      handlePayment: function () {
        // Close Modal
        document.getElementById("modal-div").style.display = "none";
    
        // Getting Table Number
        var userid;
        uid <= 9 ? (userid = `U0${uid}`) : `U${uid}`;
    
        //Reseting current orders and total bill
        firebase
          .firestore()
          .collection("users")
          .doc(userid)
          .update({
            current_orders: {},
            total_bill: 0
          })
          .then(() => {
            swal({
              icon: "success",
              title: "Thanks For Paying !",
              text: "We Hope You Enjoyed Your Toy !!",
              timer: 2500,
              buttons: false
            });
          });
      },

      handleRatings: async function (toy) {

        // Getting Table Number
        var userid;
        uid <= 9 ? (userid = `U0${uid}`) : `U${uid}`;
        
        // Getting Order Summary from database
        var orderSummary = await this.getOrderSummary(userid);
    
        var currentOrders = Object.keys(orderSummary.current_orders);    
    
        if (currentOrders.length > 0 && currentOrders==toy.id) {
          
          // Close Modal
          document.getElementById("rating-modal-div").style.display = "flex";
          document.getElementById("rating-input").value = "0";
          document.getElementById("feedback-input").value = "";
    
          //Submit button click event
          var saveRatingButton = document.getElementById("save-rating-button");
    
          saveRatingButton.addEventListener("click", () => {
            document.getElementById("rating-modal-div").style.display = "none";
            //Get the input value(Review & Rating)
            var rating = document.getElementById("rating-input").value;
            var feedback = document.getElementById("feedback-input").value;
    
            //Update db
            firebase
              .firestore()
              .collection("toys")
              .doc(toy.id)
              .update({
                last_review: feedback,
                last_rating: rating
              })
              .then(() => {
                swal({
                  icon: "success",
                  title: "Thanks For Rating!",
                  text: "We Hope You Like Your Toy !!",
                  timer: 2500,
                  buttons: false
                });
              });
          });
        } else{
          swal({
            icon: "warning",
            title: "Oops!",
            text: "No toy found to give ratings!!",
            timer: 2500,
            buttons: false
          });
        }
    
    },
    handleMarkerLost:function(){
        var buttonDiv=document.getElementById("button-div");
        buttonDiv.style.display="none";
    }

      

        
        

      
      


    
});