import { ethers } from "ethers";
import { Button, Col, Divider, Input, Row, Tooltip } from "antd";
import React, { useState,useMemo } from "react";
import Blockies from "react-blockies";
import { tryToDisplay, tryToDisplayAsText } from "./utils";
import { useContractExistsAtAddress } from "eth-hooks";


const { utils, BigNumber,Contract} = require("ethers");


const getFunctionInputKey = (functionName, input, inputIndex) => {
    const name = input?.name ? input.name : "input_" + inputIndex + "_";
    return functionName + "_" + name + "_" + input.type;
};

// Multiline jsdoc type
// https://github.com/microsoft/TypeScript/issues/16179

/**
 * 
 * Call more than one functions and generate a new return value
 * based on the returns from those functions. 
 * 
 * @param {{
      contract: Contract;
      name: string;
      provider: any;
      inputs: any[];
      calls: string[];
      transform: any;
   }} props
 */
export default function CompoundViewFunctionForm(props){

    const  {contract,name,provider,inputs,calls,transform} = props;

    const [form, setForm] = useState({});
    const [returnValue, setReturnValue] = useState();

    const address = contract ? contract.address : "";
    const contractIsDeployed = useContractExistsAtAddress(provider, address);


    // Arguments 
    const inputElements = inputs.map((input, inputIndex) => {
        const key = getFunctionInputKey(name, input, inputIndex);
    
        let buttons = "";
        if (input.type === "bytes32") {
          buttons = (
            <Tooltip placement="right" title="to bytes32">
              <div
                type="dashed"
                style={{ cursor: "pointer" }}
                onClick={async () => {
                  if (utils.isHexString(form[key])) {
                    const formUpdate = { ...form };
                    formUpdate[key] = utils.parseBytes32String(form[key]);
                    setForm(formUpdate);
                  } else {
                    const formUpdate = { ...form };
                    formUpdate[key] = utils.formatBytes32String(form[key]);
                    setForm(formUpdate);
                  }
                }}
              >
                #️⃣
              </div>
            </Tooltip>
          );
        } else if (input.type === "bytes") {
          buttons = (
            <Tooltip placement="right" title="to hex">
              <div
                type="dashed"
                style={{ cursor: "pointer" }}
                onClick={async () => {
                  if (utils.isHexString(form[key])) {
                    const formUpdate = { ...form };
                    formUpdate[key] = utils.toUtf8String(form[key]);
                    setForm(formUpdate);
                  } else {
                    const formUpdate = { ...form };
                    formUpdate[key] = utils.hexlify(utils.toUtf8Bytes(form[key]));
                    setForm(formUpdate);
                  }
                }}
              >
                #️⃣
              </div>
            </Tooltip>
          );
        } else if (input.type === "uint256") {
          buttons = (
            <Tooltip placement="right" title="* 10 ** 18">
              <div
                type="dashed"
                style={{ cursor: "pointer" }}
                onClick={async () => {
                  const formUpdate = { ...form };
                  formUpdate[key] = utils.parseEther(form[key]);
                  setForm(formUpdate);
                }}
              >
                ✴️
              </div>
            </Tooltip>
          );
        } else if (input.type === "address") {
          const possibleAddress = form[key] && form[key].toLowerCase && form[key].toLowerCase().trim();
          if (possibleAddress && possibleAddress.length === 42) {
            buttons = (
              <Tooltip placement="right" title="blockie">
                <Blockies seed={possibleAddress} scale={3} />
              </Tooltip>
            );
          }
        }
    
        return (
          <div style={{ margin: 2 }} key={key}>
            <Input
              size="large"
              placeholder={input.name ? input.type + " " + input.name : input.type}
              autoComplete="off"
              value={form[key]}
              name={key}
              onChange={event => {
                const formUpdate = { ...form };
                formUpdate[event.target.name] = event.target.value;
                setForm(formUpdate);
              }}
              suffix={buttons}
            />
          </div>
        );
      });

    const handleForm = returned => {
        if (returned) {
          setForm({});
        }
    };

    // Outputs 
    inputElements.push(
        <div style={{ cursor: "pointer", margin: 2 }} key="goButton">
          <Input
            onChange={e => setReturnValue(e.target.value)}
            defaultValue=""
            bordered={false}
            disabled
            value={returnValue}
            suffix={
              <div
                style={{ width: 50, height: 30, margin: 0 }}
                type="default"
                onClick={async () => {
                  const args = inputs.map((input, inputIndex) => {
                    const key = getFunctionInputKey(name, input, inputIndex);
                    let value = form[key];
                    if (input.type === "bool") {
                      if (value === "true" || value === "1" || value === "0x1" || value === "0x01" || value === "0x0001") {
                        value = 1;
                      } else {
                        value = 0;
                      }
                    }
                    return value;
                  });
    
                  let result;
                  {
                    // Compound function should not be a transaction.
                    try {

                        let callResults = [];
                        for(let i=0; i < calls.length; ++i){
                            const result = await contract.functions[calls[i]](...args);
                            callResults.push(result);
                        }

                        // transform 
                      const returned = transform(callResults);

                      handleForm(returned);
                      result = tryToDisplayAsText(returned);
                    } catch (err) {
                      console.error(err);
                    }
                  } 
    
                  console.log("SETTING RESULT:", result);
                  setReturnValue(result);
                }}
              >
                <Button style={{ marginLeft: -32 }}>Read📡</Button>
              </div>
            }
          />
        </div>,
      );

    return (
        contractIsDeployed ? <div>
          <Row>
            <Col
              span={8}
              style={{
                textAlign: "right",
                opacity: 0.333,
                paddingRight: 6,
                fontSize: 24,
              }}
            >
              {name}
            </Col>
            <Col span={16}>{inputElements}</Col>
          </Row>
        </div> : <div> Loading..</div>
      );

    

}