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
    return [subnet_mask_dec,subnet_mask_bin_copy]
}

function divide_in_subnets(CIDR_range, number_of_subnets) {
    let index = 0;
    let arr_subnets = table.Number_of_subnets
    for (let i=0;i<arr_subnets.length;i++) {
        if (arr_subnets[i] >= number_of_subnets) {
            index = i;
            break;
        }
    }
    const slash = CIDR_range.indexOf('/')
    let starting_network_id = CIDR_range.substring(0,slash)
    let ans = {}
    for (let i=0;i<32;i++) {
        let arr = [];
        if (i === 0) {
            arr[0] = starting_network_id
            arr[1] = table.Subnet_mask[index]
            arr[2] = parseInt(table.Number_of_hosts[index]) - 2
            let last_dot_string_number  = parseInt(starting_network_id.substring(10))
            last_dot_string_number += arr[2] + 1
            arr[3] = starting_network_id.substring(0,9) + "." + last_dot_string_number;
            starting_network_id = arr[3]
            if (parseInt(starting_network_id.substring(10)) > 255) {
                ans[i] = 0
                break
            }
        }
        else {
            let last_dot_string_number  = parseInt(starting_network_id.substring(10))
            last_dot_string_number += 1
            if (last_dot_string_number > 255 || last_dot_string_number + ans[0][2] + 1 > 255)
                break
            arr[0] = starting_network_id.substring(0,9) + "." + last_dot_string_number;
            arr[1] = table.Subnet_mask[index]
            arr[2] = parseInt(table.Number_of_hosts[index]) - 2
            arr[3] = starting_network_id.substring(0,9) + "." 
            let x = parseInt(arr[0].substring(10)) + arr[2] + 1
            arr[3] += x
            starting_network_id = arr[3]
            if (parseInt(starting_network_id.substring(10)) > 255) {
                ans[i] = null
                break
            }
        }
        ans[i] = arr 
    }
    return ans
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


app.post('/', (req,res) => {
    let CIDR_range = req.body.CIDR_range
    let number_of_subnets = req.body.no_of_subnets
    let index = -1,index_of_last_dot = -1
    for (let i=0;i<CIDR_range.length;i++) {
        if (CIDR_range.charAt(i) === '/')
            index = i
    }
    for (let i=0;i<CIDR_range.length;i++) {
        if (CIDR_range.charAt(i) === '.')
            index_of_last_dot = i
    }
    let network_id_of_CIDR = CIDR_range.substring(0,index)
    let subnet_mask = give_subnet_mask(CIDR_range)
    let subnets_table = divide_in_subnets(CIDR_range,number_of_subnets)
    let Number_of_hosts = give_number_of_hosts(subnet_mask[1])
    if (Object.keys(subnets_table).length <= 1) {
        let broadcast_id = CIDR_range.substring(0,index_of_last_dot)
        broadcast_id += '.'
        let host_id = CIDR_range.substring(index_of_last_dot+1,index)
        host_id = parseInt(host_id)
        host_id += Number_of_hosts + 1;
        broadcast_id += host_id
        res.render('no_subnets', {subnet_mask,Number_of_hosts,network_id_of_CIDR,CIDR_range,broadcast_id})
    }
    else if (number_of_subnets <= Object.keys(subnets_table).length)
        res.render('output', {CIDR_range,subnet_mask,subnets_table,number_of_subnets,Number_of_hosts,network_id_of_CIDR})
    else
        res.send('invalid number of subnets')
})


app.listen(5000, () => {
    console.log('LISTENING');
})