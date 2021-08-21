/* Heroku deployed */
/* For test commit */



if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}



const express = require('express')
const app = express();
const path = require('path')
const session = require('express-session');


app.use(express.static(__dirname + '/public'));


app.use(session({
    name: 'session',
    secret: process.env.SECRET || 'thisisasecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}))


/* Set method of express to join the path to cwd */
app.set('views',path.join(__dirname,'views'))

/* Setting view engine to ejs used for dynamic templating */
app.set('view engine','ejs')


app.use(express.json());

/* Use method of express to convert the req object to readable form */
app.use(express.urlencoded({extended:true}))


// let table = {
//     "Number_of_subnets" : [1,2,4,8,16,32,64,128,256],
//     "Number_of_hosts" : [256,128,64,32,16,8,4,2,1],
//     "Subnet_mask" : ['/24','/25','/26','/27','/28','/29','/30','/31','/32']
// }

app.get('/', (req,res) => {
    res.render('home')
})

function bin_to_dec(binary) {
    let decimal = 0;
    for (let i = binary.length-1;i>=0;i--) 
        decimal += (1<<(binary.length -  i - 1))*(binary.charAt(i) - '0')
    return decimal
}

function dec_to_bin(decimal) {
    let ans =  Number(decimal).toString(2)
    let x = ans.length
    for (let i=0;i<8-x;i++)
        ans = '0' + ans
    return ans
}

function input_check_method(CIDR_range) {
    let dots_count = CIDR_range.split('.').length - 1
    let slash_count = CIDR_range.split('/').length - 1
    if (dots_count === 3 && slash_count === 1) {
        let dots_array = []
        for (let i=0;i<CIDR_range.length;i++) {
            if (CIDR_range.charAt(i) === '.')
                dots_array.push(i)
        }
        for (let i=0;i<dots_array.length-1;i++) {
            if (dots_array[i+1] - dots_array[i] < 2)
                return false
        }
        return true
    }
    return false
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
    return [subnet_mask_dec,subnet_mask_bin_copy]
}


function give_number_of_hosts(binary_string) {
    let hosts = 0,zeroes = 0;
    for (let i=0;i<binary_string.length;i++) {
        if (binary_string[i] === '0')
            ++zeroes;
    }
    hosts = (1<<zeroes) - 2;
    return hosts
}


function give_network_id(CIDR_range,net_mask) {
    let ans = ''
    let index = -1,c = 0
    for (let i=0;i<CIDR_range.length;i++) {
        if (CIDR_range.charAt(i) === '/') {
            index = i
            break;
        }
    }
    let net_id = CIDR_range.substring(0,index)
    let binary_net_id = ''
    let binary_net_mask = ''
    for (let i=0;i<net_id.length;i++) {
        if (net_id.charAt(i) === '.') {
            binary_net_id += dec_to_bin(net_id.substring(c,i)) + '.'
            c = i+1;
        }
    }
    binary_net_id += dec_to_bin(net_id.substring(c))
    c = 0
    for (let i=0;i<net_mask.length;i++) {
        if (net_mask.charAt(i) === '.') {
            binary_net_mask += dec_to_bin(net_mask.substring(c,i)) + '.'
            c = i+1;
        }
    }
    binary_net_mask += dec_to_bin(net_mask.substring(c))
    for (let i=0;i<binary_net_id.length;i++) {
        if (binary_net_id.charAt(i) === '.')
            ans += '.'
        else
            ans += ((binary_net_id.charAt(i)) & (binary_net_mask.charAt(i)))
    }
    c = 0
    let final_ans = ''
    for (let i=0;i<ans.length;i++) {
        if (ans.charAt(i) === '.') {
            final_ans += bin_to_dec(ans.substring(c,i)) + '.'
            c = i+1
        }
    }
    final_ans += bin_to_dec(ans.substring(c))
    return final_ans
}
function give_broadcast_id(CIDR_range,net_mask) {
    let net_id = give_network_id(CIDR_range,net_mask)
    let binary_net_id = ''
    let c = 0
    for (let i=0;i<net_id.length;i++) {
        if (net_id.charAt(i) === '.') {
            binary_net_id += dec_to_bin(net_id.substring(c,i)) + '.'
            c = i+1
        }
    }
    binary_net_id += dec_to_bin(net_id.substring(c))
    c = 0
    let binary_net_mask = '',ans = ''
    for (let i=0;i<net_mask.length;i++) {
        if (net_mask.charAt(i) === '.') {
            binary_net_mask += dec_to_bin(net_mask.substring(c,i)) + '.'
            c = i+1;
        }
    }
    binary_net_mask += dec_to_bin(net_mask.substring(c))
    let binary_net_mask_actual = ''
    for (let i=0;i<binary_net_mask.length;i++) {
        if (binary_net_mask.charAt(i) === '.')
            binary_net_mask_actual += '.'
        else if (binary_net_mask.charAt(i) === '0')
            binary_net_mask_actual += '1' 
        else
            binary_net_mask_actual += '0' 
    }
    for (let i=0;i<binary_net_id.length;i++) {
        if (binary_net_id.charAt(i) === '.')
            ans += '.'
        else
            ans += ((binary_net_id.charAt(i)) | (binary_net_mask_actual.charAt(i)))
    }
    c = 0
    let final_ans = ''
    for (let i=0;i<ans.length;i++) {
        if (ans.charAt(i) === '.') {
            final_ans += bin_to_dec(ans.substring(c,i)) + '.'
            c = i+1
        }
    }
    final_ans += bin_to_dec(ans.substring(c))
    return final_ans
}

function give_range(network_id,broadcast_id) {
    let index = -1,index_broadcast = -1
    for (let i=0;i<network_id.length;i++) {
        if (network_id.charAt(i) === '.') 
            index = i
    }
    for (let i=0;i<broadcast_id.length;i++) {
        if (broadcast_id.charAt(i) === '.') 
            index_broadcast = i
    }
    let last_number_network = parseInt(network_id.substring(index+1))
    last_number_network += 1
    let last_number_broadcast = parseInt(broadcast_id.substring(index_broadcast+1))
    last_number_broadcast -= 1
    return network_id.substring(0,index+1) + last_number_network + " " + "-" + " " + broadcast_id.substring(0,index_broadcast+1) + last_number_broadcast
}

app.post('/', (req,res) => {
    let CIDR_range = req.body.CIDR_range
    let input_check_var = true
    if (!input_check_method(CIDR_range)) {
        input_check_var = false
        res.render('output', {input_check_var})
    }
    else {
        let subnet_mask = give_subnet_mask(CIDR_range)
        let network_id_of_CIDR = give_network_id(CIDR_range,subnet_mask[0])
        //let subnets_table = divide_in_subnets(CIDR_range,number_of_subnets)
        let broadcast_id = give_broadcast_id(CIDR_range,subnet_mask[0])
        let Number_of_hosts = give_number_of_hosts(subnet_mask[1])
        let range = give_range(network_id_of_CIDR,broadcast_id)
        res.render('output', {input_check_var,CIDR_range,subnet_mask,Number_of_hosts,network_id_of_CIDR,broadcast_id,range})
    }
})



const port = process.env.PORT || 5000
app.listen(port, () => {
    console.log(`LISTENING ON PORT ${port}`)
})