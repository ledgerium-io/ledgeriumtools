# ledgeriumtools
ledgeriumtools

<h2> LedgeriumTools </h2>

Generates a docker-compose yaml for deploying N nodes with IBFT consensus<br>
<strike>Currently takes input only from the mnemonic.json file<br><br></strike>
Takes input from the command line interface, prompts to enter number of menmonics<br>
<code> Number of Mnemonics : 2 </code><br>
<code> Enter Mnemonic 0 : *******************************************************</code><br>
<code> Enter Password 0 : ***************</code><br>
<code> Enter Mnemonic 1 : *******************************************************</code><br>
<code> Enter Password 1 : ***************</code><br>

Enter the Mnemonics and password which will generate the nodekeys and password

<strike><code>mode = 0</code> to generate the keys from the menmonic<br>
<code>mode = 1</code> to get the keys directly from the menmonic.json file<br></strike>

The number of nodes brought up is equal to the number of keys/menmonics provided in the file
ie n keys signifies n nodes with the respective keys as coinbase/etherbase

To start up the application provide the path to the mnemonic file and the path of the output directory<br>
<code> node index.js "<output-dir>" </code>

The docker file will be generated in the <output-dir>,<br>
use <code>docker-compose up -d</code> to start up the nodes<br>
and <code> docker-compose down </code> to bring down the nodes<br><br>

<i> <b>Note :</b> don't use the -v option to bring down the nodes as the current blockchain data will be lost </i>
