// Simple home page component with h1 and h5 tags
import React, { useEffect } from 'react'

import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';

import { Box } from "@mui/material";
import {  useParams
} from "react-router-dom";

import { fonlamalar } from "../data/fonlamalar.js";
import { projeler } from "../data/projeler.js";
import Clock from "./Clock";

import Grid from '@mui/material/Grid';
import MediaCard from './MediaCard';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { CardActionArea } from '@mui/material';

import {contracts} from '../data/contracts';
import { ethers } from "ethers";
import useMetaMask from '../hooks/metamask';
import LoadingButton from '@mui/lab/LoadingButton';
import { theme , Item } from './Theme';
import { Web3Storage } from 'web3.storage'


const CONTRACT_ADDRESS = contracts.Round.address;
const ABI = contracts.Round.abi;
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI);



async function getProjects(setProject, id){
    const ethereum = window.ethereum;
    const accounts = await ethereum.request({
        method: "eth_requestAccounts",
    });

    const provider = new ethers.providers.Web3Provider(ethereum)
    const walletAddress = accounts[0]    // first account in MetaMask
    const signer = provider.getSigner(walletAddress)

    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    const projects = await contract.getAllGrants();
    console.log(projects);
    const storage = new Web3Storage({ token: process.env.REACT_APP_STORAGE_KEY });
    // For each project in projects get content from ipfs cid at ipfsURL
    // and store it in the database
    let allProjects = [];
    try{
        const project = projects[id];
        const res = await storage.get(project.ipfsURL);
        const files = await res.files()

        for (const file of files) {
            console.log(`${file.cid}: ${file.name} (${file.size} bytes)`)
            let content = JSON.parse(await file.text())
            console.log(content)
            content.project_id = id;
            const IPFS_IMG_LINK = content.image;
            // split IPFS_IMG_LINK from /
            const STARTING_URL = 'https://gateway.pinata.cloud/ipfs/';
            const IPFS_CID =STARTING_URL + IPFS_IMG_LINK.substring(7);
            content.image = IPFS_CID;
        setProject(content);
    // allProjects.push(content);

        }
    } catch (e) {

        console.log(e);
    }

}


async function getMiktar(setMiktar, id){
    const ethereum = window.ethereum;
    const accounts = await ethereum.request({
        method: "eth_requestAccounts",
    });

    const provider = new ethers.providers.Web3Provider(ethereum)
    const walletAddress = accounts[0]    // first account in MetaMask
    const signer = provider.getSigner(walletAddress)

    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    const donationAmounts = await contract.getGrantDonationAmounts(id);
    let miktar = 0;
    donationAmounts.forEach(amount => {
        miktar += parseFloat(ethers.utils.formatEther(amount));
        console.log(parseFloat(ethers.utils.formatEther(amount)));
        
    });
    setMiktar(miktar);
    // console.log("donation amounts", donationAmounts);



}




export default function Proje() {
    const [project, setProject] = React.useState({});
    const [loading, setLoading] = React.useState(false);
    const [bagis, setBagis] = React.useState("0");
    const { account, isActive } = useMetaMask();

    const [miktar, setMiktar] = React.useState(0);



    let { id } = useParams();

    useEffect(() => {
        getProjects(setProject, id);
        getMiktar(setMiktar, id);
    }, []);


    const donate = async () => {
        console.log("Donate");
        setLoading(true);  
        // alert(bagis);
        // alert(typeof(bagis));
        // alert(account);
        // alert(typeof(account));
        console.log(bagis)
        console.log(typeof(ethers.utils.parseEther(bagis.toString()).toString()));
        console.log(typeof(account));
        console.log(typeof(id));
        let valueStr = ethers.utils.parseEther(bagis.toString()).toString();
        console.log(valueStr);
        const tx = await contract.populateTransaction.donate(id);

        console.log(tx);

        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [
                {
                    from: account,
                    value: ethers.utils.parseEther(bagis.toString()).toHexString(),
                    ...tx
                }
            ]
        })

        console.log(txHash);
        setBagis(0);
        setLoading(false);
    }

    const fonDurumu =<Box> <Item>
            <Stack spacing={2}>
                <TextField id="outlined-basic" label="Bağış miktarı" variant="outlined" value={bagis} onChange={(e) => setBagis(e.target.value)} />
                <LoadingButton loading={loading} variant="outlined" onClick={donate}>Bağış yap</LoadingButton>
            </Stack>
        </Item>
        </Box>
        ;

    return (
        <Card>

          <CardMedia
            component="img"
            image={project.image}
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              {project.title}
            </Typography>
            <Typography gutterBottom variant="h5" component="div">
              Bağışlanan miktar: {miktar} ATRY
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {project.description}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{padding:3}}>
                {fonDurumu}
            </Typography>
          </CardContent>

      </Card>
  

        // <Box>
        //     <Paper
        //     sx={{
        //         position: 'relative',
        //         backgroundColor: 'grey.800',
        //         color: '#fff',
        //         mb: 4,
        //         width: '100%',
        //     }}
        //     >
        //     <img  src={project.image}/>
        //     </Paper>
        //     <h1>{project.title}</h1>
            
        //     <MediaCard title={project.title} description={project.description} image={project.image} link={"/proje/"+project.project_id} status={project.status} />
        //     {fonDurumu}
            

        // </Box>
    )
}