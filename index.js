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


let table = {
    "Number_of_subnets" : [1,2,4,8,16,32,64,128,256],
    "Number_of_hosts" : [256,128,64,32,16,8,4,2,1],
    "Subnet_mask" : ['/24','/25','/26','/27','/28','/29','/30','/31','/32']
}

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

function divide_in_subnets(CIDR_range, number_of_subnets) {
    let number = 0,index = 0;
    let arr_subnets = table.Number_of_subnets
    for (let i=0;i<arr_subnets.length;i++) {
        if (arr_subnets[i] >= number_of_subnets) {
            number = arr_subnets[i];
            index = i;
            break;
        }
    }
    const slash = CIDR_range.indexOf('/')
    let starting_network_id = CIDR_range.substring(0,slash)
    let ans = {}
    for (let i=0;i<number;i++) {
        let arr = [];
        if (i === 0) {
            arr[0] = starting_network_id
            arr[1] = table.Subnet_mask[index]
            arr[2] = parseInt(table.Number_of_hosts[index]) - 2
            let last_dot_string_number  = parseInt(starting_network_id.substring(10))
            last_dot_string_number += arr[2] + 1
            arr[3] = starting_network_id.substring(0,9) + "." + last_dot_string_number;
            starting_network_id = arr[3]
        }
        else {
            let last_dot_string_number  = parseInt(starting_network_id.substring(10))
            last_dot_string_number += 1
            arr[0] = starting_network_id.substring(0,9) + "." + last_dot_string_number;
            arr[1] = table.Subnet_mask[index]
            arr[2] = parseInt(table.Number_of_hosts[index]) - 2
            arr[3] = starting_network_id.substring(0,9) + "." 
            let x = parseInt(arr[0].substring(10)) + arr[2] + 1
            arr[3] += x
            starting_network_id = arr[3]
        }
        ans[i] = arr 
    }
    return ans
}

app.post('/', (req,res) => {
    let CIDR_range = req.body.CIDR_range
    let number_of_subnets = req.body.no_of_subnets
    let subnet_mask = give_subnet_mask(CIDR_range)
    let subnets_table = divide_in_subnets(CIDR_range,number_of_subnets)
    //console.log(subnets_table)
    res.render('output', {CIDR_range,subnet_mask,subnets_table,number_of_subnets})
})


app.listen(5000, () => {
    console.log('LISTENING');
})