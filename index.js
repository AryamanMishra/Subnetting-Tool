const express = require('express')
const app = express();
const path = require('path')


app.use(express.static(__dirname + '/public'));

/* Set method of express to join the path to cwd */
app.set('views',path.join(__dirname,'views'))

/* Setting view engine to ejs used for dynamic templating */
app.set('view engine','ejs')


app.use(express.json());

/* Use method of express to convert the req object to readable form */
app.use(express.urlencoded({extended:true}))




app.get('/', (req,res) => {
    res.render('home')
})

function bin_to_dec(binary) {
    let decimal = 0;
    for (let i = binary.length-1;i>=0;i--) 
        decimal += (1<<(binary.length -  i - 1))*(binary.charAt(i) - '0')
    return decimal
}

function give_subnet_mask(CIDR_range) {
    const slash = CIDR_range.indexOf('/')
    let cidr = CIDR_range.substring(slash+1)
    let subnet_mask_bin = '';
    let subnet_mask_bin_copy = '';
    let subnet_mask_dec = '';
    cidr = parseInt(cidr)
    for (let i=0;i<3;i++)
        subnet_mask_bin += "00000000."
    subnet_mask_bin += "00000000";
    for (let i=0;i<subnet_mask_bin.length-3;i++) {
        if (i < cidr)
            subnet_mask_bin_copy += '1';
        else
            subnet_mask_bin_copy += '0';
    }
    subnet_mask_dec += bin_to_dec(subnet_mask_bin_copy.substring(0,8)) + ".";
    subnet_mask_dec += bin_to_dec(subnet_mask_bin_copy.substring(8,16)) + ".";
    subnet_mask_dec += bin_to_dec(subnet_mask_bin_copy.substring(16,24)) + ".";
    subnet_mask_dec += bin_to_dec(subnet_mask_bin_copy.substring(24));
    return subnet_mask_dec
}

app.post('/', (req,res) => {
    let CIDR_range = req.body.CIDR_range
    let subnet_mask = give_subnet_mask(CIDR_range)
    res.render('output', {CIDR_range,subnet_mask})
})


app.listen(5000, () => {
    console.log('LISTENING');
})