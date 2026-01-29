export const sharedStyles = new CSSStyleSheet();
sharedStyles.replaceSync(`
  .row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    margin: 0;
    border: none;
    padding: 0;
    justify-content: flex-start;
    width:100%;
  }
.column{
  display: flex;
  flex-direction: column;
  margin: 0;
  border: none;
  padding: 0;
  justify-content: flex-start;
}
.full{width:100%;}
.half{width:50%;}
._90{width:90%;}
._80{width:80%;} 
._75{width:75%;}
._70{width:70%;}
._60{width:60%;}
._50{width:50%;}
._40{width:30%;}
._33{width:33%;}
._25{width:25%;} 
._20{width:20%;}
._10{width:10%;}

`);
