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



function give_subnet(CIDR_range) {
    const slash = CIDR_range.indexOf('/')
    let cidr = CIDR_range.substring(slash+1)
    let subnet_mask = '';
    cidr = parseInt(cidr)
    let no_255 = cidr/8;
    if (cidr % 8 == 0) {
        for (let i=0;i<no_255;i++)
            subnet_mask += '255.'
    }
    else {
        for (let i=0;i<no_255-1;i++)
            subnet_mask += '255.'
    }
    let diff = 32 - cidr;
    diff = 1<<diff;
    subnet_mask += (256-diff).toString();
    return subnet_mask
}

app.post('/', (req,res) => {
    let CIDR_range = req.body.CIDR_range
    let subnet = give_subnet(CIDR_range)
    res.render('output', {CIDR_range,subnet})
})


app.listen(5000, () => {
    console.log('LISTENING');
})