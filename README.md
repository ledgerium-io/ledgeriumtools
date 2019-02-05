# ledgeriumtools
ledgeriumtools

## LedgeriumTools

Generates a docker-compose yaml for deploying N nodes with IBFT consensus

### Update initialparams.json
Edit this file before running the application
* Change mode type (full/addon)
    
    * If mode type is full, this application will create a ledgeriumnetwork folder outside ledgeriumtools which has static-nodes and externalised genesis files.
    * If mode type is addon, get latest ledgeriumnetwork files from github and paste those files under ledgeriumtools/output/tmp  
* Update domain name (optional for addon mode)

### Run ledgeriumtools application

To start the application, run
```
node index.js
```

Takes input from the command line interface, prompts to enter number of menmonics

<code> Number of Mnemonics : 2 </code><br>
<code> Enter Mnemonic 0 : *******************************************************</code><br>
<code> Enter Password 0 : ***************</code><br>
<code> Enter Mnemonic 1 : *******************************************************</code><br>
<code> Enter Password 1 : ***************</code><br>

Enter the Mnemonics and password which will generate the nodekeys and password

The number of nodes brought up is equal to the number of keys/menmonics provided in the file i.e. `n keys` signifies `n nodes` with the respective keys as coinbase/etherbase

The docker file will be generated in the `output` folder.

Change directory to output and use

* `docker-compose up -d` to start up the nodes
* `docker-compose down` to bring down the nodes

<i> <b>Note :</b> don't use the -v option to bring down the nodes as the current blockchain data will be lost<br>
for subsequent runs make sure the tmp dir created in output folder is deleted </i>