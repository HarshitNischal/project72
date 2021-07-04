import * as React from 'react';
import { Text, View,StyleSheet,TouchableOpacity, TextInput } from 'react-native';
import * as Permissions from 'expo-permissions';
import {BarCodeScanner} from 'expo-barcode-scanner';
import * as firebase from 'firebase';
import db from '../config';

export default class TransactionScreen extends React.Component {
    constructor(){
      super();
      this.state={
        hasCameraPermissions:null,
        scanned:false,
        scannedData:'',
        buttonState:'normal',
        scannedBookID:'',
        scannedStudentID:'',
        transactionMessage:''
      }
    }

    initiateBookIssue = async ()=>{
      //add a transaction
      db.collection("transaction").add({
        'studentId' : this.state.scannedStudentId,
        'bookId' : this.state.scannedBookId,
        'data' : firebase.firestore.Timestamp.now().toDate(),
        'transactionType' : "Issue"
      })
  
      //change book status
      db.collection("books").doc(this.state.scannedBookId).update({
        'bookAvailability' : false
      })
      //change number of issued books for student
      db.collection("students").doc(this.state.scannedStudentId).update({
        'numberOfBooksIssued' : firebase.firestore.FieldValue.increment(1)
      })
  
      this.setState({
        scannedStudentId : '',
        scannedBookId: ''
      })
    }

    initiateBookReturn = async ()=>{
      //add a transaction
      db.collection("transaction").add({
        'studentId' : this.state.scannedStudentId,
        'bookId' : this.state.scannedBookId,
        'data' : firebase.firestore.Timestamp.now().toDate(),
        'transactionType' : "Return"
      })
  
      //change book status
      db.collection("books").doc(this.state.scannedBookId).update({
        'bookAvailability' : true
      })
      //change number of issued books for student
      db.collection("students").doc(this.state.scannedStudentId).update({
        'numberOfBooksIssued' : firebase.firestore.FieldValue.increment(-1)
      })
  
      this.setState({
        scannedStudentId : '',
        scannedBookId: ''
      })
    }


    handleTransaction=async()=>{
      var transactionMessage;
      db.collection("books").doc(this.state.scannedBookID).get()
      .then((doc)=>{
        console.log(doc.data())
        var book=doc.data()
        if(book.bookAvailability){
          this.initiateBookIssue()
          transactionMessage='BookIssued';
        }
        else{
          this.initiateBookReturn()
          transactionMessage='BookReturned';
        }
      })
      this.setState({transactionMessage:transactionMessage});
    }

    getCameraPermissions= async(id)=>{
      const {status}=await Permissions.askAsync(Permissions.CAMERA);
      this.setState({hasCameraPermissions:status==="granted",buttonState:'id',scanned:false});
    }

    handleBarCodeScanned=async({type,data})=>{
      const {buttonState}=this.state
        if(buttonState === 'BookId'){
          this.setState({scanned:true,scannedBookID:data,buttonState:'normal'})
        }
        else if(buttonState === 'StudentId'){
          this.setState({scanned:true,scannedStudentID:data,buttonState:'normal'})
        }
    }

    render() {
      const hasCameraPermissions=this.state.hasCameraPermissions;
      const scanned=this.state.scanned;
      const buttonState=this.state.buttonState;
      if(buttonState === 'clicked' && hasCameraPermissions){
        return(
          <BarCodeScanner
          onBarCodeScanned={scanned?
            undefined:
            this.handleBarCodeScanned
          }
          style={StyleSheet.absoluteFillObject}
           />
        )
      }
      else if(buttonState === 'normal'){

      return (
        <View style={styles.container}>
          <View>
            <Image source={
              require('../assets/booklogo.jpg') }
              style={{width:200,height:200}}
            />
            <Text style={{textAlign:'center',fontSize:30}}>WILY</Text>
          </View>

          <View style={styles.inputView}>

            <TextInput style={styles.inputBox}
            placeholder='BOOK ID'
            value={this.state.scannedBookID}
            />
            <TouchableOpacity style={styles.scanButton}
             onPress={()=>{
               this.getCameraPermissions('BookId')
             }}>
              <Text style={styles.buttonText}>SCAN</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputView}>
            <TextInput style={styles.inputBox}
            placeholder='STUDENT ID'
            value={this.state.scannedStudentID}
            />
            <TouchableOpacity style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions('StudentId')
            }}>
              <Text style={styles.buttonText}>SCAN</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton}
              onPress={async()=>{
                this.handleTransaction()
              }}>
              <Text style={styles.submitButtonText}>SUBMIT</Text>
            </TouchableOpacity>
          </View>

        </View>

      );
     }
    }
  }

  const styles = StyleSheet.create({
    scanButton:{
      backgroundColor:'blue',
      width:50,
      borderWidth:1.5,
      borderLeftWidth:0
    },
    buttonText:{
      fontSize:18,
      textAlign:'center',
      marginTop:10
    },
    container:{
      flex:1,
      justifyContent:'center',
      alignItems:'center'
    },
    displayText:{
      fontSize:15,
      textDecorationLine:'underline'
    },
    inputView:{
      flexDirection:'row',
      margin:20
    },
    inputBox:{
      width:200,
      height:40,
      borderWidth:1.5,
      borderRightWidth:0,
      fontSize:20
    },
    submitButton:{
      backgroundColor:'green',
      width:100,
      height:50
    },
    submitButtonText:{
      textAlign:'center',
      fontSize:20,
      fontWeight:'bold',
      color:'#fff',
      padding:10
    }
  });